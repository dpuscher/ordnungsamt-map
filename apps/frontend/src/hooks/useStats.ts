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

export function useStats(): Stats {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [timeseries, setTimeseries] = useState<StatTimeseries[]>([]);
  const [districts, setDistricts] = useState<StatDistrict[]>([]);
  const [categories, setCategories] = useState<StatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const base = `${API_BASE}/api/stats`;
    void Promise.allSettled([
      fetchJson<StatsOverview>(`${base}/overview`, controller.signal),
      fetchJson<StatCategory[]>(`${base}/categories`, controller.signal),
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

    void fetchJson<StatTimeseries[]>(`${base}/timeseries`, controller.signal)
      .then(setTimeseries)
      .catch(error => {
        logStatsError("timeseries", error);
      });

    void fetchJson<StatDistrict[]>(`${base}/districts`, controller.signal)
      .then(setDistricts)
      .catch(error => {
        logStatsError("districts", error);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { overview, timeseries, districts, categories, loading };
}
