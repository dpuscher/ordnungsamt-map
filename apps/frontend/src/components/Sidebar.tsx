import React from "react";
import type { MapDisplayMode, StatsOverview, StatCategory } from "@ordnungsamt/shared";
import { StatsGrid } from "./StatsGrid";
import { LayerControls } from "./LayerControls";
import { DistrictFilter } from "./DistrictFilter";
import { CategoryList } from "./CategoryList";
import { DateFilter } from "./DateFilter";

interface SidebarProps {
  isOpen: boolean;
  overview: StatsOverview | null;
  categories: StatCategory[];
  statsLoading: boolean;
  displayMode: MapDisplayMode;
  district: string | undefined;
  category: string | undefined;
  from: string | undefined;
  to: string | undefined;
  onDisplayModeChange: (mode: MapDisplayMode) => void;
  onDistrictChange: (v: string | undefined) => void;
  onCategoryChange: (v: string | undefined) => void;
  onDateChange: (from: string | undefined, to: string | undefined) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] font-sans font-semibold text-[10px] tracking-[1px] text-muted uppercase mb-3">
      {children}
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

export function Sidebar({
  isOpen,
  overview,
  categories,
  statsLoading,
  displayMode,
  district,
  category,
  from,
  to,
  onDisplayModeChange,
  onDistrictChange,
  onCategoryChange,
  onDateChange,
}: SidebarProps) {
  return (
    <aside
      className={`absolute md:relative h-full w-full md:w-[280px] flex-col shrink-0 overflow-y-auto shadow-2xl md:shadow-none z-[2000] bg-surface border-r border-border ${
        isOpen ? "flex" : "hidden md:flex"
      }`}
    >
      <div className="border-b border-border">
        <div className="px-4 pt-[14px] pb-[10px]">
          <SectionLabel>Statistiken</SectionLabel>
        </div>
        <StatsGrid overview={overview} loading={statsLoading} />
      </div>

      <div className="p-4 border-b border-border">
        <SectionLabel>Darstellung</SectionLabel>
        <LayerControls displayMode={displayMode} onModeChange={onDisplayModeChange} />
      </div>

      <div className="p-4 border-b border-border">
        <SectionLabel>Zeitraum</SectionLabel>
        <DateFilter from={from} to={to} onChange={onDateChange} />
      </div>

      <div className="p-4 border-b border-border">
        <SectionLabel>Bezirk</SectionLabel>
        <DistrictFilter active={district} onChange={onDistrictChange} />
      </div>

      <div>
        <div className="px-4 pt-[14px] pb-[10px]">
          <SectionLabel>Kategorien</SectionLabel>
        </div>
        <CategoryList categories={categories} active={category} onChange={onCategoryChange} />
      </div>
    </aside>
  );
}
