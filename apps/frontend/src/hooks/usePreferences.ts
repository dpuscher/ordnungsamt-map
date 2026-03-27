import { useState, useCallback, useEffect } from "react";
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
  heatVisible: boolean;
  pointsVisible: boolean;
  radius: number;
  blur: number;
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
  setHeatVisible: (v: boolean) => void;
  setPointsVisible: (v: boolean) => void;
  setRadius: (v: number) => void;
  setBlur: (v: number) => void;
  setMapPosition: (lat: number, lng: number, zoom: number) => void;
  setSidebarOpen: (v: boolean) => void;
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
  const [heatVisible, setHeatVisibleState] = useState(() => readPref("heatVisible", true));
  const [pointsVisible, setPointsVisibleState] = useState(() => readPref("pointsVisible", true));
  const [radius, setRadiusState] = useState(() => readPref("radius", 25));
  const [blur, setBlurState] = useState(() => readPref("blur", 5));
  const [mapLat, setMapLat] = useState(() => readPref("mapLat", DEFAULT_MAP_CENTER[0]));
  const [mapLng, setMapLng] = useState(() => readPref("mapLng", DEFAULT_MAP_CENTER[1]));
  const [mapZoom, setMapZoom] = useState(() => readPref("mapZoom", DEFAULT_MAP_ZOOM));
  const [sidebarOpen, setSidebarOpenState] = useState(() => readPref("sidebarOpen", true));

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
  const setHeatVisible = useCallback((value: boolean) => {
    setHeatVisibleState(value);
    writePref("heatVisible", value);
  }, []);
  const setPointsVisible = useCallback((value: boolean) => {
    setPointsVisibleState(value);
    writePref("pointsVisible", value);
  }, []);
  const setRadius = useCallback((value: number) => {
    setRadiusState(value);
    writePref("radius", value);
  }, []);
  const setBlur = useCallback((value: number) => {
    setBlurState(value);
    writePref("blur", value);
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
    heatVisible,
    pointsVisible,
    radius,
    blur,
    mapLat,
    mapLng,
    mapZoom,
    sidebarOpen,
    setDistrict,
    setCategory,
    setFrom,
    setTo,
    setHeatVisible,
    setPointsVisible,
    setRadius,
    setBlur,
    setMapPosition,
    setSidebarOpen,
  };
}
