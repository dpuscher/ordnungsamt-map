import React from "react";

interface DateFilterProps {
  from: string | undefined;
  to: string | undefined;
  onChange: (from: string | undefined, to: string | undefined) => void;
}

const presets = [
  { label: "7T", days: 7 },
  { label: "30T", days: 30 },
  { label: "1J", days: 365 },
  { label: "Alle", days: null as number | null },
] as const;

export function DateFilter({ from, to, onChange }: DateFilterProps) {
  const setPreset = (days: number | null) => {
    if (days === null) {
      onChange(undefined, undefined);
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    onChange(start.toISOString().split("T")[0], end.toISOString().split("T")[0]);
  };

  const isPresetActive = (days: number | null) => {
    if (days === null) return !from && !to;
    if (!from || !to) return false;
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - days);
    return from === start.toISOString().split("T")[0] && to === now.toISOString().split("T")[0];
  };

  const inputStyle: React.CSSProperties = {
    boxSizing: "border-box",
    width: "100%",
    padding: "7px 8px",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    borderRadius: 0,
    marginTop: 5,
    outline: "none",
    letterSpacing: 0.3,
    colorScheme: "dark",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Preset buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
          background: "var(--color-border)",
        }}
      >
        {presets.map(({ label, days }) => {
          const active = isPresetActive(days);
          return (
            <button
              key={label}
              style={{
                padding: "8px 4px",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.5,
                background: active ? "rgba(232,255,60,0.08)" : "var(--color-bg)",
                border: "none",
                borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: active ? "var(--color-accent)" : "var(--color-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onClick={() => setPreset(days)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Date inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              color: "var(--color-muted)",
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Von
          </div>
          <input
            type="date"
            value={from || ""}
            onChange={e => onChange(e.target.value || undefined, to)}
            style={inputStyle}
          />
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              color: "var(--color-muted)",
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Bis
          </div>
          <input
            type="date"
            value={to || ""}
            onChange={e => onChange(from, e.target.value || undefined)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
