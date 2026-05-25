"use client";

import { useEffect, useRef } from "react";

const particles = [
  { left: "8%", top: "18%", size: "h-2 w-2", delay: "0s" },
  { left: "18%", top: "68%", size: "h-1.5 w-1.5", delay: "1.4s" },
  { left: "42%", top: "12%", size: "h-2.5 w-2.5", delay: "0.8s" },
  { left: "67%", top: "28%", size: "h-1.5 w-1.5", delay: "2.1s" },
  { left: "82%", top: "62%", size: "h-2 w-2", delay: "1.1s" },
  { left: "58%", top: "82%", size: "h-1.5 w-1.5", delay: "2.6s" },
];

export function AmbientField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      element.style.setProperty("--pointer-x", `${x}px`);
      element.style.setProperty("--pointer-y", `${y}px`);
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      ref={ref}
    >
      <div className="ambient-grid absolute inset-0" />
      <div className="ambient-glow absolute inset-0" />
      <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-cyan-200/35 blur-3xl" />
      <div className="absolute -right-28 top-48 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
      {particles.map((particle) => (
        <span
          className={`float-slow absolute rounded-full bg-white shadow-[0_0_28px_rgba(56,189,248,0.45)] ring-1 ring-cyan-200/70 ${particle.size}`}
          key={`${particle.left}-${particle.top}`}
          style={{
            animationDelay: particle.delay,
            left: particle.left,
            top: particle.top,
          }}
        />
      ))}
    </div>
  );
}
