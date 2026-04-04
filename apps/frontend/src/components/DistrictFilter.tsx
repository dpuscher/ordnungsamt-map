import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
import { DISTRICTS } from "@ordnungsamt/shared";

const districtButtonVariants = cva(
  "font-sans font-medium text-[11px] py-2 px-[10px] border-none border-l-2 cursor-pointer transition-all duration-150 text-left leading-tight bg-bg",
  {
    variants: {
      active: {
        true: "bg-accent/[0.08] border-l-accent text-accent",
        false: "border-l-transparent text-muted hover:text-text hover:bg-white/[0.03]",
      },
    },
  },
);

interface DistrictFilterProps {
  active: string | undefined;
  onChange: (district: string | undefined) => void;
}

export function DistrictFilter({ active, onChange }: DistrictFilterProps) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border">
      {DISTRICTS.map(district => {
        const isActive = active === district;
        return (
          <button
            key={district}
            onClick={() => onChange(isActive ? undefined : district)}
            className={cn(districtButtonVariants({ active: isActive }))}
          >
            {district}
          </button>
        );
      })}
    </div>
  );
}
