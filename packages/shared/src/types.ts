export type MeldungStatus = "In Bearbeitung" | "Erledigt" | (string & {});

export interface Meldung {
  id: string;
  date: string;
  category: string;
  subcategory: string | null;
  district: string;
  status: MeldungStatus;
  description: string | null;
  lat: number;
  lng: number;
  report_number: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  location_note: string | null;
  last_changed: string | null;
  feedback: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface ClusteredPoint {
  lat: number;
  lng: number;
  count: number;
  primary_category: string;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  count: number;
}

export interface RawPoint {
  id: string;
  lat: number;
  lng: number;
  category: string;
  date: string;
  district: string;
  status: string;
  description: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  report_number: string | null;
}

export type MapDisplayMode = "heatmap" | "points";

export type ApiResponseType = "clustered" | "heat" | "raw";

export interface ApiResponse<T> {
  type: ApiResponseType;
  zoom: number;
  count: number;
  data: T[];
}

export interface StatsOverview {
  total: number;
  districts: number;
  today: number;
  categories: number;
  last_updated: string | null;
}

export interface StatTimeseries {
  date: string;
  count: number;
}

export interface StatDistrict {
  district: string;
  count: number;
}

export interface StatCategory {
  category: string;
  count: number;
}

export interface MapFilters {
  district?: string;
  category?: string;
  from?: string;
  to?: string;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
