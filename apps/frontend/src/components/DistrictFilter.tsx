import React from "react";
import { DISTRICTS } from "@ordnungsamt/shared";

interface DistrictFilterProps {
  active: string | undefined;
  onChange: (district: string | undefined) => void;
}

export function DistrictFilter({ active, onChange }: DistrictFilterProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1,
        background: "var(--color-border)",
      }}
    >
      {DISTRICTS.map(district => {
        const isActive = active === district;
        return (
          <button
            key={district}
            onClick={() => onChange(isActive ? undefined : district)}
            style={{
              background: isActive ? "rgba(232,255,60,0.08)" : "var(--color-bg)",
              border: "none",
              borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              color: isActive ? "var(--color-accent)" : "var(--color-muted)",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              fontSize: 11,
              padding: "8px 10px",
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "left",
              lineHeight: 1.2,
            }}
            onMouseEnter={e => {
              if (!isActive) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = "var(--color-text)";
                el.style.background = "rgba(255,255,255,0.03)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = "var(--color-muted)";
                el.style.background = "var(--color-bg)";
              }
            }}
          >
            {district}
          </button>
        );
      })}
    </div>
  );
}
