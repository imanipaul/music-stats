const SKELETON_TREND_BAR_HEIGHTS = [
  45, 70, 30, 85, 60, 40, 95, 55, 75, 35, 65, 50, 80, 45,
];

function Block({ className = "", style }) {
  return (
    <div className={`rounded bg-white/[0.06] ${className}`} style={style} />
  );
}

function SectionTitle() {
  return <Block className="mb-4 h-[13px] w-24" />;
}

function RankItemSkeleton({ round, withBar, isLast }) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-2.5 ${
        isLast ? "" : "border-b border-white/[0.07]"
      }`}
    >
      <Block className="h-3 w-[18px] shrink-0" />
      <Block
        className={`h-10 w-10 shrink-0 ${round ? "!rounded-full" : "!rounded-md"}`}
      />
      <div className="min-w-0 flex-1">
        <Block className="h-3 w-3/5" />
        <Block className="mt-1.5 h-2.5 w-2/5" />
      </div>
      {withBar && <Block className="h-[3px] w-20 shrink-0" />}
      <Block className="h-3 w-8 shrink-0" />
    </div>
  );
}

function RankListSkeleton({ rows = 8, round, withBar }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <RankItemSkeleton
          key={rowIndex}
          round={round}
          withBar={withBar}
          isLast={rowIndex === rows - 1}
        />
      ))}
    </div>
  );
}

/** Placeholder mirroring the loaded dashboard layout while data is fetched. */
export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="loading">
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
        {Array.from({ length: 3 }, (_, cardIndex) => (
          <div
            key={cardIndex}
            className="rounded-xl border border-white/[0.07] bg-[#111114] p-4"
          >
            <Block className="mb-3 h-2.5 w-16" />
            <Block className="h-7 w-24" />
            <Block className="mt-2 h-2.5 w-12" />
          </div>
        ))}
      </div>

      <div className="mb-8">
        <SectionTitle />
        <RankListSkeleton round withBar />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <SectionTitle />
          <RankListSkeleton />
        </div>
        <div>
          <SectionTitle />
          <RankListSkeleton />
        </div>
      </div>

      <div className="mb-8">
        <SectionTitle />
        <div className="rounded-[14px] border border-white/[0.07] bg-[#0d0d10] p-5">
          <div className="flex h-[180px] items-end gap-2 border-b border-l border-white/[0.04] pb-1 pl-1">
            {SKELETON_TREND_BAR_HEIGHTS.map((heightPct, barIndex) => (
              <Block
                key={barIndex}
                className="flex-1"
                style={{ height: `${heightPct}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <SectionTitle />
        <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#0d0d10]">
          {Array.from({ length: 12 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className={`flex items-center gap-2.5 px-5 py-[9px] ${
                rowIndex < 11 ? "border-b border-white/[0.07]" : ""
              }`}
            >
              <Block className="h-9 w-9 shrink-0 !rounded-md" />
              <div className="min-w-0 flex-1">
                <Block className="h-3 w-1/2" />
                <Block className="mt-1.5 h-2.5 w-1/3" />
              </div>
              <Block className="h-2.5 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
