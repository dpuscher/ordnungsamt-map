import { Router } from "express";
import { createHash } from "node:crypto";
import { MapQuerySchema, ZOOM_BREAKPOINTS } from "@ordnungsamt/shared";
import { pool } from "../db.js";
import { cacheGet, cacheSet } from "../cache.js";

const router = Router();

function getClusterGridSize(zoom: number): number {
  return Math.max(0.0005, 0.02 / 2 ** Math.max(zoom - 10, 0));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getHeatGridSize(
  zoom: number,
  minLat?: number,
  maxLat?: number,
  minLng?: number,
  maxLng?: number,
): number {
  const fallback = Math.max(0.00012, 0.012 / 2 ** Math.max(zoom - 9, 0));

  if (
    minLat === undefined ||
    maxLat === undefined ||
    minLng === undefined ||
    maxLng === undefined
  ) {
    return fallback;
  }

  const latSpan = Math.abs(maxLat - minLat);
  const lngSpan = Math.abs(maxLng - minLng);
  const longestSpan = Math.max(latSpan, lngSpan);
  const targetCells = zoom <= 10 ? 72 : zoom <= 12 ? 84 : 96;

  return clamp(longestSpan / targetCells, 0.00012, 0.008);
}

function roundBbox(value: number): string {
  return value.toFixed(2);
}

function buildCacheKey(
  zoom: number,
  displayMode: "heatmap" | "points",
  minLat?: number,
  maxLat?: number,
  minLng?: number,
  maxLng?: number,
  district?: string,
  category?: string,
  from?: string,
  to?: string,
): string {
  const bbox = [minLat, maxLat, minLng, maxLng]
    .map(v => (v === undefined ? "" : roundBbox(v)))
    .join(":");
  const filterHash = createHash("md5")
    .update(JSON.stringify({ district, category, from, to }))
    .digest("hex")
    .slice(0, 8);
  return `meldungen:${displayMode}:${zoom}:${bbox}:${filterHash}`;
}

function buildWhereClause(parameters: {
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  district?: string;
  category?: string;
  from?: string;
  to?: string;
}): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (
    parameters.minLat !== undefined &&
    parameters.maxLat !== undefined &&
    parameters.minLng !== undefined &&
    parameters.maxLng !== undefined
  ) {
    const envelope = `ST_MakeEnvelope($${index}, $${index + 1}, $${index + 2}, $${index + 3}, 4326)`;
    conditions.push(
      `location::geometry && ${envelope}`,
    );
    conditions.push(`ST_Intersects(location::geometry, ${envelope})`);
    values.push(parameters.minLng, parameters.minLat, parameters.maxLng, parameters.maxLat);
    index += 4;
  }

  if (parameters.district) {
    conditions.push(`district = $${index}`);
    values.push(parameters.district);
    index++;
  }

  if (parameters.category) {
    conditions.push(`category = $${index}`);
    values.push(parameters.category);
    index++;
  }

  if (parameters.from) {
    conditions.push(`date >= $${index}`);
    values.push(parameters.from);
    index++;
  }

  if (parameters.to) {
    conditions.push(`date <= $${index}`);
    values.push(parameters.to);
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { clause, values };
}

// GET /api/meldungen
router.get("/", async (request, res, next) => {
  try {
    const parsed = MapQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
      return;
    }

    const { zoom, displayMode, minLat, maxLat, minLng, maxLng, district, category, from, to } =
      parsed.data;

    const cacheKey = buildCacheKey(
      zoom,
      displayMode,
      minLat,
      maxLat,
      minLng,
      maxLng,
      district,
      category,
      from,
      to,
    );
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    const { clause, values } = buildWhereClause({
      minLat,
      maxLat,
      minLng,
      maxLng,
      district,
      category,
      from,
      to,
    });

    let result;
    let type: "clustered" | "heat" | "raw";
    const usePreAggregatedTotals = !district && !category && !from && !to;

    const [bubbleMin, bubbleMax] = ZOOM_BREAKPOINTS.BUBBLE;
    const [heatMin, heatMax] = ZOOM_BREAKPOINTS.HEAT;

    if (displayMode === "heatmap") {
      const gridSize = getHeatGridSize(zoom, minLat, maxLat, minLng, maxLng);
      const q = await pool.query(
        `SELECT
           ST_Y(ST_Centroid(ST_Collect(location::geometry)))::float AS lat,
           ST_X(ST_Centroid(ST_Collect(location::geometry)))::float AS lng,
           COUNT(*)::int                                             AS count
         FROM meldungen
         ${clause}
         GROUP BY ST_SnapToGrid(location::geometry, $${values.length + 1})
         ORDER BY count DESC`,
        [...values, gridSize],
      );
      result = q.rows;
      type = "heat";
    } else if (zoom >= bubbleMin && zoom <= bubbleMax && usePreAggregatedTotals) {
      // Zoom 9-11: use stats_totals materialized view with bbox filter
      const bboxConditions: string[] = [];
      const bboxValues: unknown[] = [];
      let bboxIndex = 1;

      if (
        minLat !== undefined &&
        maxLat !== undefined &&
        minLng !== undefined &&
        maxLng !== undefined
      ) {
        bboxConditions.push(
          `lat BETWEEN $${bboxIndex} AND $${bboxIndex + 1} AND lng BETWEEN $${bboxIndex + 2} AND $${bboxIndex + 3}`,
        );
        bboxValues.push(minLat, maxLat, minLng, maxLng);
        bboxIndex += 4;
      }
      if (district) {
        bboxConditions.push(`district = $${bboxIndex}`);
        bboxValues.push(district);
        bboxIndex++;
      }
      if (category) {
        bboxConditions.push(`category = $${bboxIndex}`);
        bboxValues.push(category);
        bboxIndex++;
      }

      const whereClause = bboxConditions.length > 0 ? `WHERE ${bboxConditions.join(" AND ")}` : "";

      const q = await pool.query(
        `SELECT
           lat,
           lng,
           SUM(count)::int   AS count,
           category          AS primary_category
         FROM stats_totals
         ${whereClause}
         GROUP BY lat, lng, category
         ORDER BY count DESC`,
        bboxValues,
      );
      result = q.rows;
      type = "clustered";
    } else if ((zoom >= bubbleMin && zoom <= bubbleMax) || (zoom >= heatMin && zoom <= heatMax)) {
      // Filtered low zoom and all mid zooms: real spatial clustering, finer as you zoom in
      const gridSize = getClusterGridSize(zoom);
      const q = await pool.query(
        `SELECT
           ST_Y(ST_Centroid(ST_Collect(location::geometry)))::float AS lat,
           ST_X(ST_Centroid(ST_Collect(location::geometry)))::float AS lng,
           COUNT(*)::int                                             AS count,
           MODE() WITHIN GROUP (ORDER BY category)                  AS primary_category
         FROM meldungen
         ${clause}
         GROUP BY ST_SnapToGrid(location::geometry, $${values.length + 1})
         ORDER BY count DESC`,
        [...values, gridSize],
      );
      result = q.rows;
      type = "clustered";
    } else {
      // Zoom 15-18: raw pins
      const centerLng =
        minLng !== undefined && maxLng !== undefined ? (minLng + maxLng) / 2 : undefined;
      const centerLat =
        minLat !== undefined && maxLat !== undefined ? (minLat + maxLat) / 2 : undefined;
      const hasViewportCenter = centerLng !== undefined && centerLat !== undefined;
      const orderClause = hasViewportCenter
        ? `ORDER BY location::geometry <-> ST_SetSRID(ST_MakePoint($${values.length + 1}, $${values.length + 2}), 4326), date DESC`
        : "ORDER BY date DESC";
      const q = await pool.query(
        `SELECT
           id,
           ST_Y(location::geometry)::float AS lat,
           ST_X(location::geometry)::float AS lng,
           category,
           date,
           district,
           status,
           description,
           street,
           house_number,
           postal_code,
           report_number
         FROM meldungen
         ${clause}
         ${orderClause}
         LIMIT 1500`,
        hasViewportCenter ? [...values, centerLng, centerLat] : values,
      );
      result = q.rows;
      type = "raw";
    }

    const response = { type, zoom, count: result.length, data: result };
    await cacheSet(cacheKey, JSON.stringify(response), 5 * 60);

    res.setHeader("X-Cache", "MISS");
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/meldungen/:id
router.get("/:id", async (request, res, next) => {
  try {
    const { id } = request.params;
    const q = await pool.query(
      `SELECT
         id,
         date,
         category,
         subcategory,
         district,
         status,
         description,
         ST_Y(location::geometry)::float AS lat,
         ST_X(location::geometry)::float AS lng,
         report_number,
         street,
         house_number,
         postal_code,
         location_note,
         last_changed,
         feedback,
         first_seen_at,
         last_seen_at
       FROM meldungen
       WHERE id = $1`,
      [id],
    );

    if (q.rows.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json(q.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
