"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts to a target when the value changes. Inspired by react-bits' Counter, but
 * reduced to a single requestAnimationFrame loop with no dependency. The animation
 * starts from whatever number is currently on screen, so a fast series of updates
 * (streamed case results) can't strand the display on a stale value.
 */
export function Tally({
  value,
  from,
  duration = 700,
  className = "",
  format = (n: number) => String(n),
}: {
  value: number;
  /** Where to start the first animation from. Defaults to the target. */
  from?: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}) {
  const [shown, setShown] = useState(from ?? value);
  const shownRef = useRef(from ?? value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) {
      shownRef.current = value;
      setShown(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={className} aria-hidden="true">
      {format(shown)}
    </span>
  );
}
