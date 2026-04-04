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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: 10,
        letterSpacing: 1,
        color: "var(--color-muted)",
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
      <span
        style={{
          flex: 1,
          height: 1,
          background: "var(--color-border)",
        }}
      />
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: 16,
  borderBottom: "1px solid var(--color-border)",
};

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
      className={`absolute md:relative h-full w-full md:w-[280px] flex-col shrink-0 overflow-y-auto shadow-2xl md:shadow-none ${
        isOpen ? "flex" : "hidden md:flex"
      }`}
      style={{
        zIndex: 2000,
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Stats */}
      <div style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ padding: "14px 16px 10px" }}>
          <SectionLabel>Statistiken</SectionLabel>
        </div>
        <StatsGrid overview={overview} loading={statsLoading} />
      </div>

      {/* Layer controls */}
      <div style={sectionStyle}>
        <SectionLabel>Darstellung</SectionLabel>
        <LayerControls displayMode={displayMode} onModeChange={onDisplayModeChange} />
      </div>

      {/* Date filter */}
      <div style={sectionStyle}>
        <SectionLabel>Zeitraum</SectionLabel>
        <DateFilter from={from} to={to} onChange={onDateChange} />
      </div>

      {/* District filter */}
      <div style={sectionStyle}>
        <SectionLabel>Bezirk</SectionLabel>
        <DistrictFilter active={district} onChange={onDistrictChange} />
      </div>

      {/* Category list */}
      <div>
        <div style={{ padding: "14px 16px 10px" }}>
          <SectionLabel>Kategorien</SectionLabel>
        </div>
        <CategoryList categories={categories} active={category} onChange={onCategoryChange} />
      </div>
    </aside>
  );
}
