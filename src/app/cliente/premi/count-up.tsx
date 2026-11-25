"use client";

import { useEffect, useState } from "react";

// Numero che "conta" da 0 al valore (circa 1 secondo). Con "riduci movimento" appare subito.
export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1000);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame((now) => {
      setShown(0);
      tick(now);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const text = decimals ? shown.toFixed(decimals).replace(".", ",") : String(Math.round(shown));
  return (
    <>
      <span aria-hidden>{text}</span>
      <span className="sr-only">{decimals ? value.toFixed(decimals).replace(".", ",") : value}</span>
    </>
  );
}
