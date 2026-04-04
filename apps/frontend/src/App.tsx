import { useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Map } from "./components/Map";
import { usePreferences } from "./hooks/usePreferences";
import { useStats } from "./hooks/useStats";

export default function App() {
  const prefs = usePreferences();

  const filters = useMemo(
    () => ({
      district: prefs.district,
      category: prefs.category,
      from: prefs.from,
      to: prefs.to,
    }),
    [prefs.district, prefs.category, prefs.from, prefs.to],
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
          from={prefs.from}
          to={prefs.to}
          onDisplayModeChange={prefs.setDisplayMode}
          onDistrictChange={prefs.setDistrict}
          onCategoryChange={prefs.setCategory}
          onDateChange={(from, to) => {
            prefs.setFrom(from);
            prefs.setTo(to);
          }}
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
