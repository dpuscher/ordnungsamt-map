import React, { useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Map } from "./components/Map";
import { usePreferences } from "./hooks/usePreferences";
import { useStats } from "./hooks/useStats";

export default function App() {
  const prefs = usePreferences();
  const stats = useStats();

  const filters = useMemo(
    () => ({
      district: prefs.district,
      category: prefs.category,
      from: prefs.from,
      to: prefs.to,
    }),
    [prefs.district, prefs.category, prefs.from, prefs.to],
  );

  return (
    <>
      <Header total={stats.overview?.total ?? null} loading={stats.loading} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {prefs.sidebarOpen && (
          <Sidebar
            overview={stats.overview}
            categories={stats.categories}
            statsLoading={stats.loading}
            heatVisible={prefs.heatVisible}
            pointsVisible={prefs.pointsVisible}
            radius={prefs.radius}
            blur={prefs.blur}
            district={prefs.district}
            category={prefs.category}
            onHeatChange={prefs.setHeatVisible}
            onPointsChange={prefs.setPointsVisible}
            onRadiusChange={prefs.setRadius}
            onBlurChange={prefs.setBlur}
            onDistrictChange={prefs.setDistrict}
            onCategoryChange={prefs.setCategory}
          />
        )}
        <Map
          filters={filters}
          heatVisible={prefs.heatVisible}
          pointsVisible={prefs.pointsVisible}
          radius={prefs.radius}
          blur={prefs.blur}
          initialLat={prefs.mapLat}
          initialLng={prefs.mapLng}
          initialZoom={prefs.mapZoom}
          onPositionChange={prefs.setMapPosition}
        />
      </div>
    </>
  );
}
