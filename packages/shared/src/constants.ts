export const DISTRICTS = [
  "Mitte",
  "Friedrichshain-Kreuzberg",
  "Pankow",
  "Charlottenburg-Wilmersdorf",
  "Spandau",
  "Steglitz-Zehlendorf",
  "Tempelhof-Schöneberg",
  "Neukölln",
  "Treptow-Köpenick",
  "Marzahn-Hellersdorf",
  "Lichtenberg",
  "Reinickendorf",
] as const;

export type District = (typeof DISTRICTS)[number];

export const DISTRICT_BOUNDS: Record<
  District,
  { minLat: number; maxLat: number; minLng: number; maxLng: number }
> = {
  Mitte: {
    minLat: 52.49873654971134,
    maxLat: 52.567735610862776,
    minLng: 13.301530461543415,
    maxLng: 13.429402280699215,
  },
  "Friedrichshain-Kreuzberg": {
    minLat: 52.48277046362933,
    maxLat: 52.531025593025575,
    minLng: 13.368215305236783,
    maxLng: 13.49145351470173,
  },
  Pankow: {
    minLat: 52.51992757256359,
    maxLat: 52.67550765972353,
    minLng: 13.347557123530532,
    maxLng: 13.523021983682014,
  },
  "Charlottenburg-Wilmersdorf": {
    minLat: 52.46649910326689,
    maxLat: 52.549428613426464,
    minLng: 13.186596860222215,
    maxLng: 13.341421041682787,
  },
  Spandau: {
    minLat: 52.4396149930656,
    maxLat: 52.598795432496594,
    minLng: 13.109296343456721,
    maxLng: 13.282182416666162,
  },
  "Steglitz-Zehlendorf": {
    minLat: 52.3872254333212,
    maxLat: 52.47183688722015,
    minLng: 13.088347614730992,
    maxLng: 13.371595407385048,
  },
  "Tempelhof-Schöneberg": {
    minLat: 52.37613990578372,
    maxLat: 52.50494117746471,
    minLng: 13.319982932785106,
    maxLng: 13.427456694244569,
  },
  Neukölln: {
    minLat: 52.395946039691964,
    maxLat: 52.49586381903805,
    minLng: 13.399497171455314,
    maxLng: 13.524063305474222,
  },
  "Treptow-Köpenick": {
    minLat: 52.338245549997296,
    maxLat: 52.49757717973329,
    minLng: 13.439657172942823,
    maxLng: 13.761159145035254,
  },
  "Marzahn-Hellersdorf": {
    minLat: 52.47047716598626,
    maxLat: 52.574509087087144,
    minLng: 13.516883749953994,
    maxLng: 13.65850154491123,
  },
  Lichtenberg: {
    minLat: 52.46793765718569,
    maxLat: 52.59646285604879,
    minLng: 13.45619649542896,
    maxLng: 13.567704769470474,
  },
  Reinickendorf: {
    minLat: 52.5488063524014,
    maxLat: 52.66073867694934,
    minLng: 13.201615766772154,
    maxLng: 13.389281658499934,
  },
};

export const CATEGORIES = [
  "Abfall",
  "Straßenaufsicht",
  "Parkraumbewirtschaftung",
  "Verkehr",
  "Baustellen",
  "Grünanlage/Park",
  "Sondernutzung",
  "Lärm",
  "Straßenverkehrsrechtliche Anordnungen",
  "Baumschutz",
  "Winterdienst",
  "Bauaufsicht",
  "Gewerbe/Gaststätten",
  "Gesundheitsschutz/Hygiene",
  "Drogenutensilien (z.B. Spritze)",
  "Hund",
  "Tierschutz",
  "Jugendschutz",
  "Ladenöffnung",
  "Naturschutzgebiet",
  "Nichtraucherschutz",
  "Feuerwerk",
  "Motorroller/Kleinkraftrad",
  "Regeneinläufe, Gully",
  "Spielplätze",
  "Lebensmittelaufsicht",
  "Filmaufnahmen",
  "Friedhofsordnung",
  "Veranstaltungen",
  "Sonstiges",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Abfall: "#e8ff3c",
  Straßenaufsicht: "#34d399",
  Parkraumbewirtschaftung: "#fb923c",
  Verkehr: "#f59e0b",
  Baustellen: "#a78bfa",
  "Grünanlage/Park": "#4ade80",
  Sondernutzung: "#f472b6",
  Lärm: "#ff4c38",
  "Straßenverkehrsrechtliche Anordnungen": "#22d3ee",
  Baumschutz: "#65a30d",
  Winterdienst: "#60a5fa",
  Bauaufsicht: "#00d4ff",
  "Gewerbe/Gaststätten": "#fbbf24",
  "Gesundheitsschutz/Hygiene": "#ef4444",
  "Drogenutensilien (z.B. Spritze)": "#c084fc",
  Hund: "#a16207",
  Tierschutz: "#84cc16",
  Jugendschutz: "#06b6d4",
  Ladenöffnung: "#14b8a6",
  Naturschutzgebiet: "#16a34a",
  Nichtraucherschutz: "#e879f9",
  Feuerwerk: "#f43f5e",
  "Motorroller/Kleinkraftrad": "#fb7185",
  "Regeneinläufe, Gully": "#38bdf8",
  Spielplätze: "#2dd4bf",
  Lebensmittelaufsicht: "#f97316",
  Filmaufnahmen: "#8b5cf6",
  Friedhofsordnung: "#78716c",
  Veranstaltungen: "#06b6d4",
  Sonstiges: "#94a3b8",
};

export const ZOOM_BREAKPOINTS = {
  BUBBLE: [9, 12] as [number, number],
  HEAT: [13, 15] as [number, number],
  PINS: [16, 18] as [number, number],
};

export const OA_API_URL =
  "https://ordnungsamt.berlin.de/frontend.webservice.opendata/api/meldungen";

export const DEFAULT_MAP_CENTER: [number, number] = [52.52, 13.405];
export const DEFAULT_MAP_ZOOM = 12;
