import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import type { ApiResponse, ClusteredPoint, RawPoint, MapFilters } from "@ordnungsamt/shared";
import { CATEGORY_COLORS, ZOOM_BREAKPOINTS } from "@ordnungsamt/shared";
import { Legend } from "./Legend";
import { useMapData } from "../hooks/useMapData";

// Extend leaflet types for heatmap
declare module "leaflet" {
  type HeatLatLngTuple = [lat: number, lng: number, intensity?: number];
  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: HeatLatLngTuple[]): this;
    setOptions(options: HeatLayerOptions): this;
  }
  interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    gradient?: Record<string, string>;
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
  }
  function heatLayer(latlngs: HeatLatLngTuple[], options?: HeatLayerOptions): HeatLayer;
}

const HEAT_GRADIENT = {
  0: "#00d4ff",
  0.5: "#e8ff3c",
  1: "#ff4c38",
};

interface MapProps {
  filters: MapFilters;
  heatVisible: boolean;
  pointsVisible: boolean;
  radius: number;
  blur: number;
  initialLat: number;
  initialLng: number;
  initialZoom: number;
  onPositionChange: (lat: number, lng: number, zoom: number) => void;
}

export function Map({
  filters,
  heatVisible,
  pointsVisible,
  radius,
  blur,
  initialLat,
  initialLng,
  initialZoom,
  onPositionChange,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markersRef = useRef<CircleMarker[]>([]);
  const bubbleLayerRef = useRef<L.LayerGroup | null>(null);

  const { data, fetchData } = useMapData();

  const loadHeatPlugin = useCallback(async () => {
    if (typeof (L as unknown as { heatLayer?: unknown }).heatLayer === "function") return;
    await import("leaflet.heat" as never);
  }, []);

  const triggerFetch = useCallback(
    (map: LeafletMap) => {
      const zoom = map.getZoom();
      const bounds = map.getBounds();
      void fetchData(
        zoom,
        {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        },
        filters,
      );
    },
    [fetchData, filters],
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true,
      renderer: L.canvas(),
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    bubbleLayerRef.current = L.layerGroup().addTo(map);

    map.on("moveend", () => {
      const center = map.getCenter();
      onPositionChange(center.lat, center.lng, map.getZoom());
      void triggerFetch(map);
    });

    mapRef.current = map;
    void triggerFetch(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (mapRef.current) {
      void triggerFetch(mapRef.current);
    }
  }, [filters, triggerFetch]);

  // Render layers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;

    const zoom = data.zoom;
    const [bubbleMin, bubbleMax] = ZOOM_BREAKPOINTS.BUBBLE;
    const [heatMin, heatMax] = ZOOM_BREAKPOINTS.HEAT;

    // Clear existing layers
    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];
    heatLayerRef.current?.remove();
    heatLayerRef.current = null;
    bubbleLayerRef.current?.clearLayers();

    if (zoom >= bubbleMin && zoom <= bubbleMax) {
      // Bubble map: circles sized by count
      if (!pointsVisible) return;
      const clustered = data as ApiResponse<ClusteredPoint>;
      const maxCount = Math.max(...clustered.data.map(p => p.count), 1);

      for (const point of clustered.data) {
        const r = 6 + (point.count / maxCount) * 30;
        const color = CATEGORY_COLORS[point.primary_category] ?? "#94a3b8";
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: r,
          fillColor: color,
          fillOpacity: 0.6,
          stroke: true,
          color: color,
          weight: 1,
          opacity: 0.8,
        });
        marker.bindPopup(
          `<div style="font-family:'DM Mono',monospace">
            <div style="color:#e8ff3c;font-size:11px;margin-bottom:4px">${point.primary_category}</div>
            <div style="font-size:12px;color:#e2e4e8">${point.count.toLocaleString("de-DE")} Meldungen</div>
          </div>`,
        );
        bubbleLayerRef.current?.addLayer(marker);
      }
    } else if (zoom >= heatMin && zoom <= heatMax) {
      // Heatmap
      if (heatVisible) {
        const clustered = data as ApiResponse<ClusteredPoint>;
        const points = clustered.data.map(p => [p.lat, p.lng, p.count] as [number, number, number]);

        void loadHeatPlugin().then(() => {
          if (!map || heatLayerRef.current !== null) return;
          heatLayerRef.current = (
            L as unknown as typeof L & {
              heatLayer: (pts: [number, number, number][], opts: object) => L.HeatLayer;
            }
          )
            .heatLayer(points, {
              radius,
              blur: blur * 5,
              gradient: HEAT_GRADIENT,
              minOpacity: 0.3,
            })
            .addTo(map);
        });
      }
    } else {
      // Raw pins at high zoom
      if (!pointsVisible) return;
      const raw = data as ApiResponse<RawPoint>;
      for (const point of raw.data) {
        const color = CATEGORY_COLORS[point.category] ?? "#94a3b8";
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: 5,
          fillColor: color,
          fillOpacity: 0.8,
          stroke: true,
          color: color,
          weight: 1,
        });
        const dateStr = new Date(point.date).toLocaleString("de-DE", {
          dateStyle: "short",
          timeStyle: "short",
        });
        const address = [point.street, point.house_number].filter(Boolean).join(" ");
        const addressLine = address
          ? `<div style="font-size:12px;color:#e2e4e8;margin-bottom:2px">${address}</div>`
          : "";
        const postalLine = point.postal_code
          ? `<div style="font-size:11px;color:#5a5f6e;margin-bottom:4px">${point.postal_code} ${point.district}</div>`
          : `<div style="font-size:11px;color:#5a5f6e;margin-bottom:4px">${point.district}</div>`;
        marker.bindPopup(
          `<div style="font-family:'DM Mono',monospace;min-width:200px">
            <div style="color:#e8ff3c;font-size:11px;margin-bottom:6px;letter-spacing:1px">${point.category}</div>
            ${addressLine}
            ${postalLine}
            <div style="font-size:11px;color:#5a5f6e">${dateStr}</div>
            <div style="font-size:11px;color:#5a5f6e;margin-top:2px">Status: ${point.status}</div>
          </div>`,
        );
        const m = marker.addTo(map);
        markersRef.current.push(m);
      }
    }
  }, [data, heatVisible, pointsVisible, radius, blur, loadHeatPlugin]);

  // Update heatmap options when radius/blur change without re-fetching
  useEffect(() => {
    if (heatLayerRef.current) {
      (
        heatLayerRef.current as unknown as {
          setOptions: (opts: object) => void;
        }
      ).setOptions({ radius, blur: blur * 5 });
    }
  }, [radius, blur]);

  // Show/hide layers
  useEffect(() => {
    if (heatLayerRef.current) {
      if (heatVisible) {
        mapRef.current?.addLayer(heatLayerRef.current);
      } else {
        mapRef.current?.removeLayer(heatLayerRef.current);
      }
    }
  }, [heatVisible]);

  return (
    <div style={{ flex: 1, position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <Legend />
    </div>
  );
}
