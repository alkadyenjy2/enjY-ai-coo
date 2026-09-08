import React from "react";

export const Panel: React.FC<{
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, badge, children, className = "" }) => (
  <section className={`bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden ${className}`}>
    <header className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-[13px] font-bold text-white font-sans tracking-tight">{title}</h3>
        {subtitle ? <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">{subtitle}</p> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

export const Tag: React.FC<{ tone?: "emerald" | "amber" | "rose" | "cyan" | "zinc" | "violet"; children: React.ReactNode }> = ({
  tone = "zinc",
  children,
}) => {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    zinc: "bg-zinc-800/80 text-zinc-300 border-zinc-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const Row: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono = true }) => (
  <div className="flex items-start justify-between gap-3 py-1.5 border-b border-zinc-800/70 last:border-0">
    <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wide shrink-0">{label}</span>
    <span className={`text-[12px] text-zinc-200 text-right break-words ${mono ? "font-mono" : "font-sans"}`}>{value}</span>
  </div>
);

export const DataSourceBadge: React.FC<{ source: string }> = ({ source }) =>
  source === "supabase-live" ? (
    <Tag tone="emerald">LIVE · SUPABASE</Tag>
  ) : (
    <Tag tone="amber">DEMO · IN-MEMORY</Tag>
  );

export const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  const colour = score >= 65 ? "#34d399" : score >= 40 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative w-[92px] h-[92px] shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#27272a" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={colour}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white font-mono leading-none">{score}</span>
        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">score</span>
      </div>
    </div>
  );
};
