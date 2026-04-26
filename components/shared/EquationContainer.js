"use client";

// EquationContainer.js
// Thin client wrapper used by Markdown.js to scale overflowing block equations
// on mobile. Finds every .katex-display inside itself and shrinks its font-size
// in small steps until it no longer exceeds the container width.

import { useRef, useEffect } from "react";

const MIN_FONT_EM = 0.55;
const STEP        = 0.025;

function scaleEquations(container) {
  if (!container) return;
  const containerWidth = container.clientWidth;
  const equations = container.querySelectorAll(".katex-display");

  equations.forEach((eq) => {
    eq.style.fontSize = "";          // reset before measuring
    let size = 1;

    while (eq.scrollWidth > containerWidth && size > MIN_FONT_EM) {
      size = Math.max(MIN_FONT_EM, +(size - STEP).toFixed(3));
      eq.style.fontSize = `${size}em`;
    }
  });
}

export default function EquationContainer({ className, style, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth > 640) return;

    scaleEquations(ref.current);

    const ro = new ResizeObserver(() => scaleEquations(ref.current));
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
