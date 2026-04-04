import { useState, useEffect } from "react";
import type {
  StatsOverview,
  StatTimeseries,
  StatDistrict,
  StatCategory,
} from "@ordnungsamt/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function logStatsError(resource: string, error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return;
  }

  console.error(`[stats] Failed to load ${resource}`, error);
}

export interface Stats {
  overview: StatsOverview | null;
  timeseries: StatTimeseries[];
  districts: StatDistrict[];
  categories: StatCategory[];
  loading: boolean;
}

export interface StatsFilters {
  district?: string;
  category?: string;
  from?: string;
  to?: string;
}

export function useStats(filters: StatsFilters = {}): Stats {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [timeseries, setTimeseries] = useState<StatTimeseries[]>([]);
  const [districts, setDistricts] = useState<StatDistrict[]>([]);
  const [categories, setCategories] = useState<StatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    function buildQuery(overrides: Partial<StatsFilters> = {}): string {
      const merged = { ...filters, ...overrides };
      const params = new URLSearchParams();
      if (merged.district) params.set("district", merged.district);
      if (merged.category) params.set("category", merged.category);
      if (merged.from) params.set("from", merged.from);
      if (merged.to) params.set("to", merged.to);
      const search = params.toString();
      return search ? `?${search}` : "";
    }

    const base = `${API_BASE}/api/stats`;
    void Promise.allSettled([
      fetchJson<StatsOverview>(`${base}/overview${buildQuery()}`, controller.signal),
      // Omit category so all categories remain visible with their filtered counts
      fetchJson<StatCategory[]>(`${base}/categories${buildQuery({ category: undefined })}`, controller.signal),
    ])
      .then(([overviewResult, categoriesResult]) => {
        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value);
        } else {
          logStatsError("overview", overviewResult.reason);
        }

        if (categoriesResult.status === "fulfilled") {
          setCategories(categoriesResult.value);
        } else {
          logStatsError("categories", categoriesResult.reason);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    void fetchJson<StatTimeseries[]>(`${base}/timeseries${buildQuery()}`, controller.signal)
      .then(setTimeseries)
      .catch(error => {
        logStatsError("timeseries", error);
      });

    // Omit district so all districts remain visible with their filtered counts
    void fetchJson<StatDistrict[]>(`${base}/districts${buildQuery({ district: undefined })}`, controller.signal)
      .then(setDistricts)
      .catch(error => {
        logStatsError("districts", error);
      });

    return () => {
      controller.abort();
    };
  }, [filters.district, filters.category, filters.from, filters.to]);

  return { overview, timeseries, districts, categories, loading };
}
