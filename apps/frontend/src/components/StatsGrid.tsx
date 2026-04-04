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
    <div
      style={{
        display: "grid",
        gap: 1,
        background: "var(--color-border)",
      }}
    >
      {/* Primary stat: total */}
      <div
        style={{
          background: "var(--color-bg)",
          padding: "10px 16px 12px",
          borderLeft: "3px solid var(--color-accent)",
          animation: "fadeInUp 0.35s ease both",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 52,
            color: "var(--color-accent)",
            lineHeight: 1,
            letterSpacing: 1,
          }}
        >
          {total}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 8,
            color: "var(--color-muted)",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: 5,
          }}
        >
          Meldungen gesamt
        </div>
      </div>

      {/* Secondary stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          background: "var(--color-border)",
        }}
      >
        {[
          { value: today, label: "Heute" },
          { value: districts, label: "Bezirke" },
          { value: categories, label: "Kategorien" },
        ].map(({ value, label }, i) => (
          <div
            key={label}
            style={{
              background: "var(--color-bg)",
              padding: "9px 12px 9px",
              animation: `fadeInUp 0.35s ease ${0.05 * (i + 1)}s both`,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                color: "var(--color-text)",
                lineHeight: 1,
                opacity: 0.75,
              }}
            >
              {value}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 7,
                color: "var(--color-muted)",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
