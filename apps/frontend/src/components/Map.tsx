import { useEffect, useRef, useCallback } from "react";
import escapeHtml from "escape-html";
import L from "leaflet";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import type {
  ApiResponse,
  ClusteredPoint,
  HeatPoint,
  MapDisplayMode,
  MapFilters,
  RawPoint,
} from "@ordnungsamt/shared";
import { CATEGORY_COLORS, DISTRICT_BOUNDS, ZOOM_BREAKPOINTS } from "@ordnungsamt/shared";
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getHeatLayerOptions(zoom: number): L.HeatLayerOptions {
  const [bubbleMin] = ZOOM_BREAKPOINTS.BUBBLE;
  const zoomProgress = clamp((zoom - bubbleMin) / (18 - bubbleMin), 0, 1);
  let radius = 24;
  let blur = 18;

  if (zoom >= 12 && zoom <= 13) {
    radius = 15;
    blur = 11;
  } else if (zoom >= 14 && zoom <= 15) {
    radius = 15;
    blur = 11;
  } else if (zoom >= 16) {
    radius = 13;
    blur = 10;
  }

  return {
    radius,
    blur,
    gradient: HEAT_GRADIENT,
    minOpacity: 0.08 + (1 - zoomProgress) * 0.05,
    maxZoom: 19,
    max: 1,
  };
}

function canRenderHeatLayer(map: LeafletMap): boolean {
  const size = map.getSize();
  return size.x > 0 && size.y > 0;
}

function safeInvalidateSize(map: LeafletMap): void {
  const container = map.getContainer();
  const internalMap = map as LeafletMap & {
    _mapPane?: HTMLElement;
  };

  if (!container.isConnected || !internalMap._mapPane) return;

  try {
    map.invalidateSize(false);
  } catch (error) {
    console.warn("[map] Skipping invalidateSize before Leaflet panes are ready", error);
  }
}

function getClusterMarkerStyle(zoom: number, count: number, maxCount: number): L.CircleMarkerOptions {
  const [bubbleMin, bubbleMax] = ZOOM_BREAKPOINTS.BUBBLE;
  const isLowZoom = zoom >= bubbleMin && zoom <= bubbleMax;
  const normalized = count / Math.max(maxCount, 1);

  if (isLowZoom) {
    return {
      radius: 7 + normalized * 28,
      fillOpacity: 0.52,
      stroke: true,
      weight: 1,
      opacity: 0.8,
    };
  }

  return {
    radius: 4 + normalized * 10,
    fillOpacity: 0.42,
    stroke: true,
    weight: 1,
    opacity: 0.7,
  };
}

function getFetchPadding(displayMode: MapDisplayMode, zoom: number): number {
  if (displayMode === "points") {
    if (zoom >= 19) return 0.18;
    if (zoom >= 18) return 0.28;
    if (zoom >= 16) return 0.35;
    return 0.18;
  }

  if (zoom >= 16) return 0.28;
  if (zoom >= 13) return 0.18;
  return 0.1;
}

function normalizeHouseNumber(houseNumber: string | null): string | null {
  if (!houseNumber) return null;

  const trimmed = houseNumber.trim();
  if (!trimmed || trimmed === "0") return null;

  return trimmed;
}

function getQuantile(values: number[], quantile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * quantile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower] ?? 0;

  const lowerValue = sorted[lower] ?? 0;
  const upperValue = sorted[upper] ?? lowerValue;
  const t = index - lower;
  return lowerValue + (upperValue - lowerValue) * t;
}

function filterHeatPointsForZoom(
  points: [number, number, number][],
  zoom: number,
): [number, number, number][] {
  if (points.length === 0 || zoom >= 14) return points;

  const weights = points.map(([, , weight]) => weight);
  const quantile = zoom <= 11 ? 0.78 : 0.62;
  const threshold = getQuantile(weights, quantile);
  const minimumWeight = zoom <= 11 ? 0.22 : 0.14;
  const filtered = points.filter(([, , weight]) => weight >= Math.max(threshold, minimumWeight));

  if (filtered.length >= 24) return filtered;

  return [...points]
    .sort((a, b) => b[2] - a[2])
    .slice(0, Math.min(points.length, zoom <= 11 ? 40 : 80));
}

function toViewportRelativeWeight(count: number, counts: number[]): number {
  if (counts.length <= 1) return 0.75;

  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  if (maxCount === minCount) {
    const absoluteWeight = 0.18 + (Math.log1p(Math.max(count, 1)) / Math.log(6)) * 0.18;
    return clamp(absoluteWeight, 0.24, 0.42);
  }

  const floor = getQuantile(counts, 0.35);
  const ceiling = Math.max(getQuantile(counts, 0.9), floor + 1);
  const normalized = clamp((count - floor) / (ceiling - floor), 0, 1);
  const emphasized = normalized ** 1.4;

  return 0.04 + emphasized * 0.96;
}

function toHeatPoints(
  response: ApiResponse<ClusteredPoint> | ApiResponse<HeatPoint> | ApiResponse<RawPoint>,
): [number, number, number][] {
  if (response.type === "raw") {
    return response.data.map(point => [point.lat, point.lng, 0.22] as [number, number, number]);
  }

  if (response.type === "heat") {
    const heat = response as ApiResponse<HeatPoint>;
    const counts = heat.data.map(point => point.count);

    return heat.data.map(point => {
      return [
        point.lat,
        point.lng,
        toViewportRelativeWeight(point.count, counts),
      ] as [number, number, number];
    });
  }

  const clustered = response as ApiResponse<ClusteredPoint>;
  const counts = clustered.data.map(point => point.count);

  return clustered.data.map(point => {
    return [
      point.lat,
      point.lng,
      toViewportRelativeWeight(point.count, counts),
    ] as [number, number, number];
  });
}

interface MapProps {
  filters: MapFilters;
  displayMode: MapDisplayMode;
  initialLat: number;
  initialLng: number;
  initialZoom: number;
  onPositionChange: (lat: number, lng: number, zoom: number) => void;
}

export function Map({
  filters,
  displayMode,
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
  const resizeFrameRef = useRef<number | null>(null);

  const { data, fetchData } = useMapData();

  const triggerFetchRef = useRef<((map: LeafletMap) => void) | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);

  const loadHeatPlugin = useCallback(async () => {
    if (typeof (L as unknown as { heatLayer?: unknown }).heatLayer === "function") return;
    await import("leaflet.heat" as never);
  }, []);

  const triggerFetch = useCallback(
    (map: LeafletMap) => {
      const zoom = map.getZoom();
      const bounds = map.getBounds().pad(getFetchPadding(displayMode, zoom));
      void fetchData(
        zoom,
        displayMode,
        {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLng: bounds.getWest(),
          maxLng: bounds.getEast(),
        },
        filters,
      );
    },
    [displayMode, fetchData, filters],
  );

  // Keep refs up to date so event handlers registered once always call the current version
  useEffect(() => {
    triggerFetchRef.current = triggerFetch;
  }, [triggerFetch]);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

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
      onPositionChangeRef.current(center.lat, center.lng, map.getZoom());
      triggerFetchRef.current?.(map);
    });

    mapRef.current = map;
    triggerFetchRef.current?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;

    const scheduleResize = () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        if (mapRef.current === map) {
          safeInvalidateSize(map);
        }
      });
    };

    scheduleResize();

    const observer = new ResizeObserver(() => {
      scheduleResize();
    });

    observer.observe(container);
    window.addEventListener("resize", scheduleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", scheduleResize);

      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (mapRef.current) {
      void triggerFetch(mapRef.current);
    }
  }, [filters, triggerFetch]);

  // Re-fetch immediately when switching between heatmap and points so the data shape matches the renderer.
  useEffect(() => {
    if (mapRef.current) {
      void triggerFetch(mapRef.current);
    }
  }, [displayMode, triggerFetch]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !filters.district) return;

    const bounds = DISTRICT_BOUNDS[filters.district as keyof typeof DISTRICT_BOUNDS];
    if (!bounds) return;

    map.fitBounds(
      [
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng],
      ],
      {
        padding: [8, 8],
      },
    );
  }, [filters.district]);

  // Render layers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;

    const zoom = data.zoom;
    const isHeatMode = displayMode === "heatmap";

    // Clear existing layers
    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = [];
    heatLayerRef.current?.remove();
    heatLayerRef.current = null;
    bubbleLayerRef.current?.clearLayers();

    if (isHeatMode) {
      const heatPoints = filterHeatPointsForZoom(
        toHeatPoints(
          data as ApiResponse<ClusteredPoint> | ApiResponse<HeatPoint> | ApiResponse<RawPoint>,
        ),
        zoom,
      );
      const heatOptions = getHeatLayerOptions(zoom);

      void loadHeatPlugin().then(() => {
        const currentMap = mapRef.current;
        if (!currentMap || heatLayerRef.current !== null) return;

        safeInvalidateSize(currentMap);
        if (!canRenderHeatLayer(currentMap)) return;

        try {
          heatLayerRef.current = (
            L as unknown as typeof L & {
              heatLayer: (
                pts: [number, number, number][],
                opts: L.HeatLayerOptions,
              ) => L.HeatLayer;
            }
          )
            .heatLayer(heatPoints, heatOptions)
            .addTo(currentMap);
        } catch (error) {
          console.error("[map] Failed to render heat layer", error);
          heatLayerRef.current?.remove();
          heatLayerRef.current = null;
        }
      });
    } else if (data.type === "clustered") {
      // Aggregated point mode: large bubbles at low zoom, tighter clusters in the middle range
      const clustered = data as ApiResponse<ClusteredPoint>;
      const maxCount = Math.max(...clustered.data.map(p => p.count), 1);

      for (const point of clustered.data) {
        const color = CATEGORY_COLORS[point.primary_category] ?? "#94a3b8";
        const markerStyle = getClusterMarkerStyle(zoom, point.count, maxCount);
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: markerStyle.radius,
          fillColor: color,
          fillOpacity: markerStyle.fillOpacity,
          stroke: markerStyle.stroke,
          color: color,
          weight: markerStyle.weight,
          opacity: markerStyle.opacity,
        });
        marker.bindPopup(
          `<div style="font-family:'DM Mono',monospace">
            <div style="color:#e8ff3c;font-size:11px;margin-bottom:4px">${escapeHtml(point.primary_category)}</div>
            <div style="font-size:12px;color:#e2e4e8">${point.count.toLocaleString("de-DE")} Meldungen</div>
          </div>`,
        );
        bubbleLayerRef.current?.addLayer(marker);
      }
    } else if (data.type === "raw") {
      // Raw pins only at street-level zooms
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
        const address = [point.street, normalizeHouseNumber(point.house_number)]
          .filter(Boolean)
          .join(" ");
        const addressLine = address
          ? `<div style="font-size:12px;color:#e2e4e8;margin-bottom:2px">${address}</div>`
          : "";
        const postalLine = point.postal_code
          ? `<div style="font-size:11px;color:#5a5f6e;margin-bottom:4px">${point.postal_code} ${point.district}</div>`
          : `<div style="font-size:11px;color:#5a5f6e;margin-bottom:4px">${point.district}</div>`;

        const descriptionLine = point.description
          ? `<div style="font-size:11px;color:#94a3b8;margin-top:8px;padding-top:8px;border-top:1px solid #2d3139;max-height:100px;overflow-y:auto;white-space:pre-wrap">${escapeHtml(point.description)}</div>`
          : "";

        marker.bindPopup(
          `<div style="font-family:'DM Mono',monospace;min-width:200px;max-width:300px">
            <div style="color:#e8ff3c;font-size:11px;margin-bottom:6px;letter-spacing:1px">${point.category}</div>
            ${addressLine}
            ${postalLine}
            <div style="font-size:11px;color:#5a5f6e">${dateStr}</div>
            <div style="font-size:11px;color:#5a5f6e;margin-top:2px">Status: ${point.status}</div>
            ${descriptionLine}
          </div>`,
        );

        const m = marker.addTo(map);
        markersRef.current.push(m);
      }
    } else {
      // Ignore stale heat responses while the points-mode refetch is in flight.
      return;
    }
  }, [data, displayMode, loadHeatPlugin]);

  // Update heatmap options when zoom changes without re-fetching
  useEffect(() => {
    if (heatLayerRef.current && data) {
      if (!mapRef.current || !canRenderHeatLayer(mapRef.current)) return;

      (
        heatLayerRef.current as unknown as {
          setOptions: (opts: L.HeatLayerOptions) => void;
        }
      ).setOptions(getHeatLayerOptions(data.zoom));
    }
  }, [data]);

  return (
    <div style={{ flex: 1, position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {displayMode === "heatmap" ? <Legend /> : null}
    </div>
  );
}
