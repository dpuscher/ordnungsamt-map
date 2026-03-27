import React from "react";
import { DISTRICTS } from "@ordnungsamt/shared";

interface DistrictFilterProps {
  active: string | undefined;
  onChange: (district: string | undefined) => void;
}

export function DistrictFilter({ active, onChange }: DistrictFilterProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {DISTRICTS.map(district => {
        const isActive = active === district;
        return (
          <button
            key={district}
            onClick={() => onChange(isActive ? undefined : district)}
            style={{
              background: isActive ? "rgba(232,255,60,0.1)" : "var(--color-bg)",
              border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
              color: isActive ? "var(--color-accent)" : "var(--color-muted)",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-muted)";
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
