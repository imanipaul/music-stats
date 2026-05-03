"use client";

import Link from "next/link";

export default function DetailLayout({ children, backLabel = "← dashboard" }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] font-mono text-[#f0eff4]">
      <div className="mx-auto max-w-[700px] px-6 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[12px] text-[#7b7a87] hover:text-[#c8a8f0] hover:underline"
          >
            {backLabel}
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
