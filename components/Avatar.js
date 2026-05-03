"use client";

import { useState } from "react";

export default function Avatar({ src, round, size = 40 }) {
  const [err, setErr] = useState(false);
  const dim = size === 36 ? "h-9 w-9" : "h-10 w-10";
  const radius = round ? "rounded-full" : "rounded-md";
  const cls = `block shrink-0 object-cover bg-[#1f1f26] ${dim} ${radius}`;
  if (!src || err) return <div className={cls} />;
  return (
    <img src={src} alt="" className={cls} onError={() => setErr(true)} />
  );
}
