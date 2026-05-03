"use client";

import Link from "next/link";
import Avatar from "./Avatar";

export default function RankItem({
  rank,
  img: imgSrc,
  round,
  name,
  meta,
  plays,
  barPct,
  nameHref,
  metaHref,
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.07] py-2.5 px-5">
      <span className="w-[18px] shrink-0 text-right font-mono text-[11px] text-[#504f5c]">
        {rank}
      </span>
      <Avatar src={imgSrc} round={round} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-sans text-[13px] font-medium text-[#f0eff4]">
          {nameHref ? (
            <Link
              href={nameHref}
              className="hover:text-[#c8a8f0] hover:underline"
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </div>
        {meta && (
          <div className="mt-0.5 truncate font-mono text-[11px] text-[#7b7a87]">
            {metaHref ? (
              <Link
                href={metaHref}
                className="hover:text-[#c8a8f0] hover:underline"
              >
                {meta}
              </Link>
            ) : (
              meta
            )}
          </div>
        )}
      </div>
      {barPct !== undefined && (
        <div className="h-[3px] w-20 shrink-0 rounded-sm bg-[#1f1f26]">
          <div
            className="h-full rounded-sm bg-gradient-to-r from-[#9b5de5] to-[#c8a8f0]"
            style={{ width: `${barPct}%` }}
          />
        </div>
      )}
      <span className="whitespace-nowrap font-mono text-xs font-medium text-[#c8a8f0]">
        {parseInt(plays).toLocaleString()}
      </span>
    </div>
  );
}
