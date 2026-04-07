-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Main reports table
CREATE TABLE IF NOT EXISTS meldungen (
  id            TEXT        PRIMARY KEY,
  date          TIMESTAMPTZ NOT NULL,
  category      TEXT        NOT NULL,
  subcategory   TEXT,
  district      TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'offen',
  description   TEXT,
  location      GEOGRAPHY(POINT, 4326) NOT NULL,
  report_number TEXT,
  street        TEXT,
  house_number  TEXT,
  postal_code   TEXT,
  location_note TEXT,
  last_changed  TIMESTAMPTZ,
  feedback      TEXT,
  raw_json      JSONB       NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for viewport queries
CREATE INDEX IF NOT EXISTS meldungen_location_idx
  ON meldungen USING GIST(location);
CREATE INDEX IF NOT EXISTS meldungen_location_geometry_idx
  ON meldungen USING GIST((location::geometry));

-- Compound index for filter queries
CREATE INDEX IF NOT EXISTS meldungen_filter_idx
  ON meldungen(district, category, date DESC);

CREATE INDEX IF NOT EXISTS meldungen_date_idx
  ON meldungen(date DESC);

-- Materialized view: daily stats aggregated by day/district/category/status
CREATE MATERIALIZED VIEW IF NOT EXISTS stats_daily AS
SELECT
  date_trunc('day', date)::DATE AS day,
  district,
  category,
  status,
  COUNT(*)                        AS count
FROM meldungen
GROUP BY 1, 2, 3, 4;

CREATE UNIQUE INDEX IF NOT EXISTS stats_daily_unique_idx
  ON stats_daily(day, district, category, status);
CREATE INDEX IF NOT EXISTS stats_daily_day_idx ON stats_daily(day DESC);
CREATE INDEX IF NOT EXISTS stats_daily_district_idx ON stats_daily(district);

-- Materialized view: overall totals per district with centroids
CREATE MATERIALIZED VIEW IF NOT EXISTS stats_totals AS
SELECT
  district,
  category,
  COUNT(*)                              AS count,
  ST_X(ST_Centroid(
    ST_Collect(location::geometry)
  ))                                    AS lng,
  ST_Y(ST_Centroid(
    ST_Collect(location::geometry)
  ))                                    AS lat
FROM meldungen
GROUP BY district, category;

CREATE UNIQUE INDEX IF NOT EXISTS stats_totals_unique_idx
  ON stats_totals(district, category);
CREATE INDEX IF NOT EXISTS stats_totals_district_idx ON stats_totals(district);

-- Collector run logs
CREATE TABLE IF NOT EXISTS logs_collector (
  id          SERIAL      PRIMARY KEY,
  started_at  TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  fetched     INTEGER,
  inserted    INTEGER,
  updated     INTEGER,
  error       TEXT
);

-- Ignored records (no coordinates or otherwise unprocessable)
CREATE TABLE IF NOT EXISTS meldungen_ignored (
  id            TEXT        PRIMARY KEY,
  raw_json      JSONB       NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
