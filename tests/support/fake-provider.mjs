/**
 * A local OpenAI-compatible stub, used only to exercise the real route end to end
 * without a provider key. It is not a demo: its outputs are fixed test data, and the
 * server it runs against is never presented as a real evaluation.
 *
 *   node tests/support/fake-provider.mjs 4111
 */

import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 4111);

const GOOD = {
  "ORD-2291": { order_id: "ORD-2291", reason: "cracked screen", amount_usd: 42.5, wants_replacement: false },
  "ORD-4410": { order_id: "ORD-4410", reason: "duplicate delivery fee and missing refund", amount_usd: 34.99, wants_replacement: false },
  "ORD-7712": { order_id: "ORD-7712", reason: "mug arrived chipped", amount_usd: 18, wants_replacement: false },
  "ORD-7713": { order_id: "ORD-7713", reason: "lamp broken in the box", amount_usd: null, wants_replacement: true },
  "ORD-5501": { order_id: "ORD-5501", reason: "overcharged at checkout", amount_usd: null, wants_replacement: false },
};

function subject(user, system) {
  if (system.includes("NARROW")) return "I think that's probably fine, but it depends.";
  const id = Object.keys(GOOD).find((key) => user.includes(key));
  if (id === "ORD-7712") {
    // A two-request message: both requests unless the prompt explicitly merges them.
    if (system.includes("merge them into one object")) return JSON.stringify(GOOD["ORD-7712"]);
    return JSON.stringify([GOOD["ORD-7712"], GOOD["ORD-7713"]]);
  }
  if (id) return JSON.stringify(GOOD[id]);
  if (user.includes("usual one")) {
    return JSON.stringify({ order_id: null, reason: "the order is unclear", amount_usd: null, wants_replacement: false });
  }
  return "I couldn't find an order in that message.";
}

function judge(system) {
  if (system.includes("NARROW")) return JSON.stringify({ verdict: "fail", reason: "It resolved an unclear reference instead of stating it." });
  return JSON.stringify({ verdict: "pass", reason: "The response asserts nothing the message doesn't support." });
}

const server = createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
  });
  request.on("end", () => {
    if (request.url?.endsWith("/models")) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ data: [{ id: "openai/gpt-oss-20b" }, { id: "openai/gpt-oss-120b" }] }));
      return;
    }

    let payload = {};
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      response.writeHead(400).end('{"error":"bad json"}');
      return;
    }

    const system = payload.messages?.find((message) => message.role === "system")?.content ?? "";
    const user = payload.messages?.find((message) => message.role === "user")?.content ?? "";
    const isJudge = system.includes("careful evaluator");
    const content = isJudge ? judge(system) : subject(user, system);

    // A little latency so progressive delivery is observable rather than instantaneous.
    setTimeout(() => {
      response.writeHead(200, {
        "Content-Type": "application/json",
        "x-ratelimit-limit-requests": "30",
        "x-ratelimit-remaining-requests": "29",
      });
      response.end(
        JSON.stringify({
          id: "chatcmpl-stub",
          model: payload.model ?? "stub",
          choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
          usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140 },
        }),
      );
    }, 120);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`fake provider listening on http://127.0.0.1:${port}/v1`);
});
