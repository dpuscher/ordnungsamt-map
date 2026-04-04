import React from "react";
import type { StatsOverview } from "@ordnungsamt/shared";

interface StatsGridProps {
  overview: StatsOverview | null;
  loading: boolean;
}

export function StatsGrid({ overview, loading }: StatsGridProps) {
  const dash = "—";
  const total = loading ? dash : (overview?.total ?? 0).toLocaleString("de-DE");
  const today = loading ? dash : (overview?.today ?? 0).toLocaleString("de-DE");
  const districts = loading ? dash : String(overview?.districts ?? 0);
  const categories = loading ? dash : String(overview?.categories ?? 0);

  return (
    <div className="grid gap-px bg-border">
      <div
        className="bg-bg pt-[10px] px-4 pb-3 border-l-[3px] border-l-accent"
        style={{ animation: "fadeInUp 0.35s ease both" }}
      >
        <div className="font-display text-[52px] text-accent leading-none tracking-[1px]">
          {total}
        </div>
        <div className="font-mono text-[8px] text-muted tracking-[2px] uppercase mt-[5px]">
          Meldungen gesamt
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border">
        {(
          [
            { value: today, label: "Heute" },
            { value: districts, label: "Bezirke" },
            { value: categories, label: "Kategorien" },
          ] as const
        ).map(({ value, label }, i) => (
          <div
            key={label}
            className="bg-bg py-[9px] px-3"
            style={{ animation: `fadeInUp 0.35s ease ${0.05 * (i + 1)}s both` }}
          >
            <div className="font-display text-[28px] text-text/75 leading-none">
              {value}
            </div>
            <div className="font-mono text-[7px] text-muted tracking-[1.5px] uppercase mt-1">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
