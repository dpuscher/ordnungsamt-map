import { useState, useRef, useCallback } from "react";
import type {
  ApiResponse,
  ClusteredPoint,
  MapBounds,
  HeatPoint,
  MapDisplayMode,
  MapFilters,
  RawPoint,
} from "@ordnungsamt/shared";

type MapData = ApiResponse<ClusteredPoint> | ApiResponse<HeatPoint> | ApiResponse<RawPoint> | null;

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function useMapData() {
  const [data, setData] = useState<MapData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (zoom: number, displayMode: MapDisplayMode, bounds: MapBounds, filters: MapFilters) => {
      // Cancel in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        zoom: String(zoom),
        displayMode,
        minLat: String(bounds.minLat),
        maxLat: String(bounds.maxLat),
        minLng: String(bounds.minLng),
        maxLng: String(bounds.maxLng),
      });

      if (filters.district) params.set("district", filters.district);
      if (filters.category) params.set("category", filters.category);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      try {
        const response = await fetch(`${API_BASE}/api/meldungen?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as
          | ApiResponse<ClusteredPoint>
          | ApiResponse<HeatPoint>
          | ApiResponse<RawPoint>;
        setData(json);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setError(error instanceof Error ? error.message : "Fetch error");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { data, loading, error, fetchData };
}
