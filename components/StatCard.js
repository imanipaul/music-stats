export default function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111114] p-4">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.8px] text-[#7b7a87]">
        {label}
      </div>
      <div className="font-sans text-[26px] font-extrabold text-[#f0eff4]">
        {value || "—"}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[10px] text-[#7b7a87]">{sub}</div>
      )}
    </div>
  );
}
