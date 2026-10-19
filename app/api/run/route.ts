import { admit, bodyTooLarge, identify, validatePrompt } from "@/lib/limits";
import { hasProviderKey } from "@/lib/model/client";
import { getPack } from "@/lib/packs";
import { executeRun, type RunEvent } from "@/lib/run";

/**
 * The only server endpoint. It exists because the key and the hidden inputs cannot be
 * in the browser. Every limit here is enforced server-side: a browser-side cap is a
 * courtesy, not a control.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function errorResponse(status: number, code: string, message: string, retryAfterSeconds?: number): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (retryAfterSeconds) headers["Retry-After"] = String(retryAfterSeconds);
  return new Response(JSON.stringify({ error: { code, message, retryAfterSeconds } }), { status, headers });
}

export async function POST(request: Request): Promise<Response> {
  if (bodyTooLarge(request.headers)) {
    return errorResponse(413, "body_too_large", "That request is larger than this endpoint accepts.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "The request body wasn't valid JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse(422, "invalid_request", "Send an object with a packId and a prompt.");
  }

  const { packId, prompt } = body as { packId?: unknown; prompt?: unknown };
  if (typeof packId !== "string" || !getPack(packId)) {
    return errorResponse(422, "unknown_pack", "That challenge pack doesn't exist.");
  }

  const checked = validatePrompt(prompt);
  if (!checked.ok) return errorResponse(checked.status, checked.code, checked.message);

  if (!hasProviderKey()) {
    return errorResponse(
      503,
      "not_configured",
      "Evaluation isn't configured on this deployment: no model API key is set. Nothing was scored.",
    );
  }

  const admission = await admit(identify(request.headers));
  if (!admission.ok) {
    return errorResponse(admission.status, admission.code, admission.message, admission.retryAfterSeconds);
  }

  const encoder = new TextEncoder();
  const signal = request.signal;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: RunEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        for await (const event of executeRun({ packId, prompt: checked.prompt, spend: admission.spend })) {
          if (signal.aborted) break;
          send(event);
        }
      } catch (error) {
        // A crash mid-stream still ends as a typed, readable run error — never a
        // half-finished run that looks like a score.
        console.error("[run] stream failed:", error);
        send({
          type: "error",
          code: "run_failed",
          message: "The run stopped unexpectedly. Nothing was scored from the cases that didn't finish.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
