import React from "react";
import { CATEGORY_COLORS } from "@ordnungsamt/shared";
import type { StatCategory } from "@ordnungsamt/shared";

interface CategoryListProps {
  categories: StatCategory[];
  active: string | undefined;
  onChange: (category: string | undefined) => void;
}

export function CategoryList({ categories, active, onChange }: CategoryListProps) {
  const maxCount = Math.max(...categories.map(c => c.count), 1);

  return (
    <div style={{ paddingBottom: 16 }}>
      {categories.map(cat => {
        const color = CATEGORY_COLORS[cat.category] ?? "#94a3b8";
        const isActive = active === cat.category;
        const barWidth = `${Math.round((cat.count / maxCount) * 100)}%`;
        const pct = `${Math.round((cat.count / maxCount) * 100)}%`;

        return (
          <div
            key={cat.category}
            onClick={() => onChange(isActive ? undefined : cat.category)}
            style={{
              cursor: "pointer",
              borderLeft: `3px solid ${isActive ? color : "transparent"}`,
              background: isActive ? "rgba(232,255,60,0.04)" : "transparent",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px 0 13px",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: color,
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.6,
                  transition: "opacity 0.15s",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-accent)" : "var(--color-text)",
                  flex: 1,
                  transition: "color 0.15s",
                  lineHeight: 1.3,
                }}
              >
                {cat.category}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: isActive ? "var(--color-accent)" : "var(--color-muted)",
                  opacity: 0.8,
                  transition: "color 0.15s",
                  flexShrink: 0,
                }}
              >
                {cat.count.toLocaleString("de-DE")}
              </span>
            </div>

            {/* Bar chart */}
            <div
              style={{
                position: "relative",
                height: 2,
                background: "var(--color-border)",
                margin: "5px 14px 0 16px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: barWidth,
                  background: isActive ? color : color,
                  opacity: isActive ? 0.9 : 0.4,
                  transition: "width 0.5s ease, opacity 0.15s",
                }}
              />
            </div>

            <div
              style={{
                height: 6,
                borderBottom: "1px solid var(--color-border)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
