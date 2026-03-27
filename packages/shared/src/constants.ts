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
  BUBBLE: [9, 11] as [number, number],
  HEAT: [12, 14] as [number, number],
  PINS: [15, 18] as [number, number],
};

export const OA_API_URL =
  "https://ordnungsamt.berlin.de/frontend.webservice.opendata/api/meldungen";

export const DEFAULT_MAP_CENTER: [number, number] = [52.52, 13.405];
export const DEFAULT_MAP_ZOOM = 12;
