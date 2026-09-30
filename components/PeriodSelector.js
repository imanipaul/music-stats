"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Segmented control whose highlight pill slides to the selected option. */
export default function PeriodSelector({ periods, value, onChange }) {
  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const [pill, setPill] = useState(null);

  useLayoutEffect(() => {
    function measure() {
      const selectedButton = buttonRefs.current[value];
      if (!selectedButton) return;
      setPill({
        left: selectedButton.offsetLeft,
        width: selectedButton.offsetWidth,
      });
    }
    measure();
    // Re-measure when layout shifts (e.g. web fonts finishing loading).
    if (typeof ResizeObserver === "undefined") return;
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="relative mb-8 flex w-fit gap-1 rounded-[10px] border border-white/[0.07] bg-[#111114] p-1"
    >
      {pill && (
        <span
          aria-hidden
          className="absolute bottom-1 left-0 top-1 rounded-[7px] bg-[#3d2060] transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            width: pill.width,
            transform: `translateX(${pill.left}px)`,
          }}
        />
      )}
      {periods.map((periodOption) => {
        const selected = value === periodOption.value;
        return (
          <button
            key={periodOption.value}
            ref={(buttonElement) => {
              buttonRefs.current[periodOption.value] = buttonElement;
            }}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(periodOption.value)}
            className={`relative z-10 cursor-pointer rounded-[7px] border-none px-3.5 py-1.5 font-mono text-[11px] transition-colors duration-300 ${
              selected ? "text-[#c8a8f0]" : "text-[#7b7a87]"
            } ${!pill && selected ? "bg-[#3d2060]" : "bg-transparent"}`}
          >
            {periodOption.label}
          </button>
        );
      })}
    </div>
  );
}
