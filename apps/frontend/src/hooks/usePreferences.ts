import { useState, useCallback, useEffect } from "react";
import type { MapDisplayMode } from "@ordnungsamt/shared";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@ordnungsamt/shared";

const PREFIX = "pref_";

function readPref<T>(key: string): T | undefined;
function readPref<T>(key: string, fallback: T): T;
function readPref<T>(key: string, fallback?: T): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writePref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function getUrlParam(key: string): string | undefined {
  const params = new URLSearchParams(globalThis.location.search);
  return params.get(key) ?? undefined;
}

export interface Preferences {
  district: string | undefined;
  category: string | undefined;
  from: string | undefined;
  to: string | undefined;
  displayMode: MapDisplayMode;
  mapLat: number;
  mapLng: number;
  mapZoom: number;
  sidebarOpen: boolean;
}

export interface PreferencesActions {
  setDistrict: (v: string | undefined) => void;
  setCategory: (v: string | undefined) => void;
  setFrom: (v: string | undefined) => void;
  setTo: (v: string | undefined) => void;
  setDisplayMode: (v: MapDisplayMode) => void;
  setMapPosition: (lat: number, lng: number, zoom: number) => void;
  setSidebarOpen: (v: boolean) => void;
}

function getInitialDisplayMode(): MapDisplayMode {
  const storedMode = readPref<MapDisplayMode | undefined>("displayMode");
  if (storedMode === "heatmap" || storedMode === "points") return storedMode;

  const legacyHeatVisible = readPref<boolean | undefined>("heatVisible");
  if (legacyHeatVisible === false) return "points";

  return "heatmap";
}

export function usePreferences(): Preferences & PreferencesActions {
  const [district, setDistrictState] = useState<string | undefined>(
    () => getUrlParam("district") ?? readPref<string | undefined>("district"),
  );
  const [category, setCategoryState] = useState<string | undefined>(
    () => getUrlParam("category") ?? readPref<string | undefined>("category"),
  );
  const [from, setFromState] = useState<string | undefined>(
    () => getUrlParam("from") ?? readPref<string | undefined>("from"),
  );
  const [to, setToState] = useState<string | undefined>(
    () => getUrlParam("to") ?? readPref<string | undefined>("to"),
  );
  const [displayMode, setDisplayModeState] = useState<MapDisplayMode>(getInitialDisplayMode);
  const [mapLat, setMapLat] = useState(() => readPref("mapLat", DEFAULT_MAP_CENTER[0]));
  const [mapLng, setMapLng] = useState(() => readPref("mapLng", DEFAULT_MAP_CENTER[1]));
  const [mapZoom, setMapZoom] = useState(() => readPref("mapZoom", DEFAULT_MAP_ZOOM));
  const [sidebarOpen, setSidebarOpenState] = useState(() => readPref("sidebarOpen", false));

  // Sync URL params for shareable links
  useEffect(() => {
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (category) params.set("category", category);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const search = params.toString();
    const newUrl = search
      ? `${globalThis.location.pathname}?${search}`
      : globalThis.location.pathname;
    globalThis.history.replaceState(null, "", newUrl);
  }, [district, category, from, to]);

  const setDistrict = useCallback((value: string | undefined) => {
    setDistrictState(value);
    writePref("district", value);
  }, []);
  const setCategory = useCallback((value: string | undefined) => {
    setCategoryState(value);
    writePref("category", value);
  }, []);
  const setFrom = useCallback((value: string | undefined) => {
    setFromState(value);
    writePref("from", value);
  }, []);
  const setTo = useCallback((value: string | undefined) => {
    setToState(value);
    writePref("to", value);
  }, []);
  const setDisplayMode = useCallback((value: MapDisplayMode) => {
    setDisplayModeState(value);
    writePref("displayMode", value);
  }, []);

  const setMapPosition = useCallback((lat: number, lng: number, zoom: number) => {
    setMapLat(lat);
    setMapLng(lng);
    setMapZoom(zoom);
    writePref("mapLat", lat);
    writePref("mapLng", lng);
    writePref("mapZoom", zoom);
  }, []);

  const setSidebarOpen = useCallback((value: boolean) => {
    setSidebarOpenState(value);
    writePref("sidebarOpen", value);
  }, []);

  return {
    district,
    category,
    from,
    to,
    displayMode,
    mapLat,
    mapLng,
    mapZoom,
    sidebarOpen,
    setDistrict,
    setCategory,
    setFrom,
    setTo,
    setDisplayMode,
    setMapPosition,
    setSidebarOpen,
  };
}
