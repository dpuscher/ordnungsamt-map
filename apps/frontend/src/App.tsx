import { useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Map } from "./components/Map";
import { usePreferences } from "./hooks/usePreferences";
import { useStats } from "./hooks/useStats";

function daysToDateRange(days: number | null): { from?: string; to?: string } {
  if (days === null) return {};
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export default function App() {
  const prefs = usePreferences();

  const filters = useMemo(
    () => ({
      district: prefs.district,
      category: prefs.category,
      ...daysToDateRange(prefs.days),
    }),
    [prefs.district, prefs.category, prefs.days],
  );

  const stats = useStats(filters);

  return (
    <>
      <Header
        total={stats.overview?.total ?? null}
        loading={stats.loading}
        onToggleSidebar={() => prefs.setSidebarOpen(!prefs.sidebarOpen)}
        sidebarOpen={prefs.sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isOpen={prefs.sidebarOpen}
          overview={stats.overview}
          categories={stats.categories}
          statsLoading={stats.loading}
          displayMode={prefs.displayMode}
          district={prefs.district}
          category={prefs.category}
          days={prefs.days}
          onDisplayModeChange={prefs.setDisplayMode}
          onDistrictChange={prefs.setDistrict}
          onCategoryChange={prefs.setCategory}
          onDaysChange={prefs.setDays}
        />
        <Map
          filters={filters}
          displayMode={prefs.displayMode}
          initialLat={prefs.mapLat}
          initialLng={prefs.mapLng}
          initialZoom={prefs.mapZoom}
          onPositionChange={prefs.setMapPosition}
        />
      </div>
    </>
  );
}
