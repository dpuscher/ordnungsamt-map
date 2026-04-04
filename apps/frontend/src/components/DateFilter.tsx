import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

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

const presetButtonVariants = cva(
  "py-2 px-1 text-[10px] font-mono tracking-[0.5px] border-none border-b-2 cursor-pointer transition-all duration-150",
  {
    variants: {
      active: {
        true: "bg-accent/[0.08] border-accent text-accent",
        false: "bg-bg border-transparent text-muted",
      },
    },
  },
);

const inputClass =
  "w-full py-[7px] px-2 text-[11px] font-mono bg-bg border border-border text-text rounded-none outline-none tracking-[0.3px] mt-[5px]";

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

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="grid grid-cols-4 gap-px bg-border">
        {presets.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => setPreset(days)}
            className={cn(presetButtonVariants({ active: isPresetActive(days) }))}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-mono text-[8px] text-muted uppercase tracking-[1.5px]">Von</div>
          <input
            type="date"
            value={from || ""}
            onChange={e => onChange(e.target.value || undefined, to)}
            className={inputClass}
            style={{ colorScheme: "dark" }}
          />
        </div>
        <div>
          <div className="font-mono text-[8px] text-muted uppercase tracking-[1.5px]">Bis</div>
          <input
            type="date"
            value={to || ""}
            onChange={e => onChange(from, e.target.value || undefined)}
            className={inputClass}
            style={{ colorScheme: "dark" }}
          />
        </div>
      </div>
    </div>
  );
}
