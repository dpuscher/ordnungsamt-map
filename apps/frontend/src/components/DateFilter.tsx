import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";

interface DateFilterProps {
  days: number | null;
  onChange: (days: number | null) => void;
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

export function DateFilter({ days, onChange }: DateFilterProps) {
  return (
    <div className="grid grid-cols-4 gap-px bg-border">
      {presets.map(preset => (
        <button
          key={preset.label}
          onClick={() => onChange(preset.days)}
          className={cn(presetButtonVariants({ active: days === preset.days }))}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
