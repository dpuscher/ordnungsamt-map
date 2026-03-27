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
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 16px 16px",
      }}
    >
      {categories.map(cat => {
        const color = CATEGORY_COLORS[cat.category] ?? "#94a3b8";
        const isActive = active === cat.category;
        const barWidth = `${Math.round((cat.count / maxCount) * 100)}%`;

        return (
          <div
            key={cat.category}
            onClick={() => onChange(isActive ? undefined : cat.category)}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0 2px",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: color,
                  flexShrink: 0,
                  opacity: isActive ? 1 : 0.7,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: isActive ? "var(--color-accent)" : "var(--color-text)",
                  flex: 1,
                  transition: "color 0.15s",
                }}
              >
                {cat.category}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--color-muted)",
                }}
              >
                {cat.count.toLocaleString("de-DE")}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 2,
                background: "var(--color-border)",
                borderRadius: 1,
                margin: "2px 0 4px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  width: barWidth,
                  background: color,
                  opacity: 0.6,
                  borderRadius: 1,
                  transition: "width 0.4s",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
