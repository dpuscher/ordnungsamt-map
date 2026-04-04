import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import type { MapDisplayMode } from "@ordnungsamt/shared";

const modeButtonVariants = cva(
  "flex-1 border-none border-b-2 font-mono text-[10px] tracking-[1.5px] uppercase cursor-pointer transition-all duration-150 py-[10px] px-3 pb-[9px]",
  {
    variants: {
      active: {
        true: "bg-accent/[0.07] border-accent text-accent",
        false: "bg-bg border-transparent text-muted",
      },
    },
  },
);

interface LayerControlsProps {
  displayMode: MapDisplayMode;
  onModeChange: (mode: MapDisplayMode) => void;
}

export function LayerControls({ displayMode, onModeChange }: LayerControlsProps) {
  return (
    <div className="flex gap-px bg-border">
      {(
        [
          { mode: "heatmap", label: "Heatmap" },
          { mode: "points", label: "Punkte" },
        ] as const
      ).map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onModeChange(mode)}
          className={cn(modeButtonVariants({ active: displayMode === mode }))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
