import React from "react";
import type { StatsOverview } from "@ordnungsamt/shared";

interface StatsGridProps {
  overview: StatsOverview | null;
  loading: boolean;
}

interface StatCardProps {
  value: string;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 6,
        padding: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          color: "var(--color-accent)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

export function StatsGrid({ overview, loading }: StatsGridProps) {
  const dash = "—";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <StatCard
        value={loading ? dash : (overview?.total ?? 0).toLocaleString("de-DE")}
        label="Meldungen gesamt"
      />
      <StatCard value={loading ? dash : String(overview?.districts ?? 0)} label="Bezirke" />
      <StatCard
        value={loading ? dash : (overview?.today ?? 0).toLocaleString("de-DE")}
        label="Heute"
      />
      <StatCard value={loading ? dash : String(overview?.categories ?? 0)} label="Kategorien" />
    </div>
  );
}
