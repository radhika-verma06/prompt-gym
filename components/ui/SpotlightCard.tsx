"use client";

import { useRef, type CSSProperties, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";

/**
 * Adapted for this project from react-bits' SpotlightCard
 * (https://github.com/DavidHDev/react-bits, MIT + Commons Clause, (c) David Haz).
 * The pointer-tracking is reduced to two CSS custom properties so the card needs no
 * animation library and no client-side frame loop.
 */
export type SpotlightCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Warm tint used for the highlight. */
  color?: string;
  radius?: number;
};

export function SpotlightCard({
  children,
  className = "",
  color = "rgba(244,155,66,.22)",
  radius = 320,
  style,
  ...rest
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const track = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const box = node.getBoundingClientRect();
    node.style.setProperty("--spot-x", `${Math.round(event.clientX - box.left)}px`);
    node.style.setProperty("--spot-y", `${Math.round(event.clientY - box.top)}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={track}
      className={`group relative isolate overflow-hidden ${className}`}
      style={{ ["--spot-color" as string]: color, ["--spot-size" as string]: `${radius}px`, ...style } as CSSProperties}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
        style={{
          background:
            "radial-gradient(var(--spot-size) circle at var(--spot-x, 50%) var(--spot-y, 0%), var(--spot-color), transparent 72%)",
        }}
      />
      {children}
    </div>
  );
}
