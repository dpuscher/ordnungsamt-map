import React from "react";
import type { MapDisplayMode, StatsOverview, StatCategory } from "@ordnungsamt/shared";
import { StatsGrid } from "./StatsGrid";
import { LayerControls } from "./LayerControls";
import { DistrictFilter } from "./DistrictFilter";
import { CategoryList } from "./CategoryList";

interface SidebarProps {
  isOpen: boolean;
  overview: StatsOverview | null;
  categories: StatCategory[];
  statsLoading: boolean;
  displayMode: MapDisplayMode;
  district: string | undefined;
  category: string | undefined;
  onDisplayModeChange: (mode: MapDisplayMode) => void;
  onDistrictChange: (v: string | undefined) => void;
  onCategoryChange: (v: string | undefined) => void;
}

const sectionStyle: React.CSSProperties = {
  padding: 16,
  borderBottom: "1px solid var(--color-border)",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: 1.5,
  color: "var(--color-muted)",
  textTransform: "uppercase",
  marginBottom: 12,
};

export function Sidebar({
  isOpen,
  overview,
  categories,
  statsLoading,
  displayMode,
  district,
  category,
  onDisplayModeChange,
  onDistrictChange,
  onCategoryChange,
}: SidebarProps) {
  return (
    <aside
      className={`absolute md:relative h-full w-full md:w-[300px] flex-col shrink-0 overflow-y-auto shadow-2xl md:shadow-none ${
        isOpen ? "flex" : "hidden md:flex"
      }`}
      style={{
        zIndex: 2000,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Stats */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Statistiken</div>
        <StatsGrid overview={overview} loading={statsLoading} />
      </div>

      {/* Layer controls */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Darstellung</div>
        <LayerControls
          displayMode={displayMode}
          onModeChange={onDisplayModeChange}
        />
      </div>

      {/* District filter */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Bezirk</div>
        <DistrictFilter active={district} onChange={onDistrictChange} />
      </div>

      {/* Category list */}
      <div style={{ ...labelStyle, padding: "16px 16px 8px" }}>Kategorien</div>
      <CategoryList categories={categories} active={category} onChange={onCategoryChange} />
    </aside>
  );
}
