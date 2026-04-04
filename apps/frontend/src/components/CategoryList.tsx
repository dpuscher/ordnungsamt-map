import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import { CATEGORY_COLORS } from "@ordnungsamt/shared";
import type { StatCategory } from "@ordnungsamt/shared";

interface CategoryListProps {
  categories: StatCategory[];
  active: string | undefined;
  onChange: (category: string | undefined) => void;
}

const rowVariants = cva("cursor-pointer transition-colors duration-150 border-l-[3px]", {
  variants: {
    active: {
      true: "bg-accent/[0.04]",
      false: "hover:bg-white/[0.02]",
    },
  },
});

export function CategoryList({ categories, active, onChange }: CategoryListProps) {
  const maxCount = Math.max(...categories.map(c => c.count), 1);

  return (
    <div className="pb-4">
      {categories.map(cat => {
        const color = CATEGORY_COLORS[cat.category] ?? "#94a3b8";
        const isActive = active === cat.category;
        const barWidth = `${Math.round((cat.count / maxCount) * 100)}%`;

        return (
          <div
            key={cat.category}
            onClick={() => onChange(isActive ? undefined : cat.category)}
            className={cn(rowVariants({ active: isActive }))}
            style={{ borderLeftColor: isActive ? color : "transparent" }}
          >
            <div className="flex items-center gap-2 pt-[6px] pb-0 pr-[14px] pl-[13px]">
              <div
                className="w-[6px] h-[6px] shrink-0 transition-opacity duration-150"
                style={{ background: color, opacity: isActive ? 1 : 0.6 }}
              />
              <span
                className={cn(
                  "text-xs flex-1 transition-colors duration-150 leading-snug",
                  isActive ? "text-accent font-semibold" : "text-text",
                )}
              >
                {cat.category}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] shrink-0 transition-colors duration-150 opacity-80",
                  isActive ? "text-accent" : "text-muted",
                )}
              >
                {cat.count.toLocaleString("de-DE")}
              </span>
            </div>

            <div className="relative h-[2px] bg-border mx-[14px] ml-4 mt-[5px]">
              <div
                className={cn(
                  "absolute h-full transition-[width] duration-500",
                  isActive ? "opacity-90" : "opacity-40",
                )}
                style={{ width: barWidth, background: color }}
              />
            </div>

            <div className="h-[6px] border-b border-border" />
          </div>
        );
      })}
    </div>
  );
}
