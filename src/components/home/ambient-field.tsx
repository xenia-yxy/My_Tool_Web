"use client";

import { useEffect, useRef } from "react";

const particles = Array.from({ length: 28 }, (_, index) => ({
  delay: `${(index % 9) * -0.7}s`,
  duration: `${10 + (index % 7) * 2}s`,
  left: `${(index * 29 + 7) % 100}%`,
  size: `${3 + (index % 4) * 2}px`,
  top: `${(index * 43 + 11) % 100}%`,
}));

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
      <div className="home-grid absolute inset-0" />
      <div className="home-cursor-light absolute inset-0" />
      <div className="home-ribbon home-ribbon-one" />
      <div className="home-ribbon home-ribbon-two" />
      <div className="home-ribbon home-ribbon-three" />
      {particles.map((particle) => (
        <span
          className="home-particle"
          key={`${particle.left}-${particle.top}-${particle.size}`}
          style={{
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            left: particle.left,
            height: particle.size,
            width: particle.size,
            top: particle.top,
          }}
        />
      ))}
    </div>
  );
}
