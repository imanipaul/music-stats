"use client";

import { useState } from "react";

export default function Avatar({ src, round, size = 40 }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const dimensionClass = size === 36 ? "h-9 w-9" : "h-10 w-10";
  const radiusClass = round ? "rounded-full" : "rounded-md";
  const combinedClassName = `block shrink-0 object-cover bg-[#1f1f26] ${dimensionClass} ${radiusClass}`;
  if (!src || imageLoadFailed) return <div className={combinedClassName} />;
  return (
    <img
      src={src}
      alt=""
      className={combinedClassName}
      onError={() => setImageLoadFailed(true)}
    />
  );
}
