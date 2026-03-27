import React from "react";

export function Legend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        background: "rgba(17,19,24,0.92)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "14px 16px",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: 1.5,
          color: "var(--color-muted)",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Intensität
      </div>
      <div
        style={{
          width: 160,
          height: 10,
          borderRadius: 5,
          background: "linear-gradient(to right, #00d4ff, #e8ff3c, #ff4c38)",
          marginBottom: 6,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--color-muted)",
        }}
      >
        <span>Niedrig</span>
        <span>Mittel</span>
        <span>Hoch</span>
      </div>
    </div>
  );
}
