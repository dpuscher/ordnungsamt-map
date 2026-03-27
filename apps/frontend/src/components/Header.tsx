import React from "react";

interface HeaderProps {
  total: number | null;
  loading: boolean;
}

export function Header({ total, loading }: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 24px",
        height: 56,
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
        zIndex: 1000,
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          letterSpacing: 2,
          color: "var(--color-accent)",
        }}
      >
        ORDNUNGSAMT
        <span
          style={{
            color: "var(--color-muted)",
            margin: "0 8px",
            fontSize: 16,
          }}
        >
          /
        </span>
        HEATMAP
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(232,255,60,0.08)",
            border: "1px solid rgba(232,255,60,0.2)",
            borderRadius: 20,
            padding: "4px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--color-accent)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-accent)",
              animation: "pulse 2s infinite",
              flexShrink: 0,
            }}
          />
          Aktiv
          {total !== null && !loading && (
            <span
              style={{
                color: "var(--color-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                marginLeft: 4,
              }}
            >
              {total.toLocaleString("de-DE")}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </header>
  );
}
