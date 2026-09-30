"use client";

import { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";

const BAR_STAGGER_MS = 40;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Mounts the Chart.js bar chart only once its container scrolls into view, so
 * Chart.js's initial animation grows the bars from the baseline while the user
 * is actually looking at them.
 */
export default function ListeningTrendChart({ data, options }) {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const animatedOptions = {
    ...options,
    animation: prefersReducedMotion()
      ? false
      : {
          duration: 900,
          easing: "easeOutQuart",
          delay: (animationContext) =>
            animationContext.type === "data" &&
            animationContext.mode === "default"
              ? animationContext.dataIndex * BAR_STAGGER_MS
              : 0,
        },
  };

  return (
    <div ref={containerRef} className="h-[180px]">
      {inView && data && <Bar data={data} options={animatedOptions} />}
    </div>
  );
}
