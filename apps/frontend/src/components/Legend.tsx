import React from "react";

export function Legend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        zIndex: 1000,
        background: "rgba(13,16,24,0.95)",
        border: "1px solid var(--color-border)",
        borderLeft: "2px solid var(--color-accent)",
        padding: "12px 14px",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 8,
          letterSpacing: 2,
          color: "var(--color-muted)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Intensität
      </div>
      <div
        style={{
          width: 140,
          height: 6,
          background: "linear-gradient(to right, #00d4ff, #e8ff3c, #ff4c38)",
          marginBottom: 5,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: 8,
          color: "var(--color-muted)",
          letterSpacing: 0.5,
        }}
      >
        <span>Niedrig</span>
        <span>Mittel</span>
        <span>Hoch</span>
      </div>
    </div>
  );
}
