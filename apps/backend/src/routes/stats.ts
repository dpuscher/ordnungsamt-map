import { Router } from "express";
import { createHash } from "node:crypto";
import { pool } from "../db.js";
import { cacheGet, cacheSet } from "../cache.js";

const router = Router();

function getStringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function buildStatsFilter(district?: string, category?: string, from?: string, to?: string) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (district) {
    conditions.push(`district = $${values.length + 1}`);
    values.push(district);
  }
  if (category) {
    conditions.push(`category = $${values.length + 1}`);
    values.push(category);
  }
  if (from) {
    conditions.push(`date >= $${values.length + 1}`);
    values.push(from);
  }
  if (to) {
    conditions.push(`date < $${values.length + 1}::date + interval '1 day'`);
    values.push(to);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
    hasFilters: conditions.length > 0,
  };
}

function statsCacheKey(endpoint: string, district?: string, category?: string, from?: string, to?: string): string {
  const base = `stats:${endpoint}`;
  if (!district && !category && !from && !to) return base;
  const hash = createHash("md5")
    .update(JSON.stringify({ district, category, from, to }))
    .digest("hex")
    .slice(0, 8);
  return `${base}:${hash}`;
}

// GET /api/stats/overview
router.get("/overview", async (request, res, next) => {
  try {
    const district = getStringParam(request.query.district);
    const category = getStringParam(request.query.category);
    const from = getStringParam(request.query.from);
    const to = getStringParam(request.query.to);
    const { where, values, hasFilters } = buildStatsFilter(district, category, from, to);
    const cacheKey = statsCacheKey("overview", district, category, from, to);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    let result;
    if (hasFilters) {
      const q = await pool.query(
        `SELECT
           COUNT(*)::int                                                               AS total,
           COUNT(DISTINCT district)::int                                               AS districts,
           COUNT(*) FILTER (WHERE date >= date_trunc('day', NOW()))::int              AS today,
           COUNT(DISTINCT category)::int                                               AS categories,
           (SELECT MAX(finished_at) FROM logs_collector WHERE error IS NULL)          AS last_updated
         FROM meldungen
         ${where}`,
        values,
      );
      result = q.rows[0];
    } else {
      const q = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM meldungen)::int                                AS total,
          (SELECT COUNT(DISTINCT district) FROM meldungen)::int                AS districts,
          (SELECT COUNT(*) FROM meldungen
            WHERE date >= date_trunc('day', NOW()))::int                       AS today,
          (SELECT COUNT(DISTINCT category) FROM meldungen)::int               AS categories,
          (SELECT MAX(finished_at) FROM logs_collector WHERE error IS NULL)    AS last_updated
      `);
      result = q.rows[0];
    }

    await cacheSet(cacheKey, JSON.stringify(result), 5 * 60);
    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/timeseries
router.get("/timeseries", async (request, res, next) => {
  try {
    const district = getStringParam(request.query.district);
    const category = getStringParam(request.query.category);
    const from = getStringParam(request.query.from);
    const to = getStringParam(request.query.to);
    const { where, values, hasFilters } = buildStatsFilter(district, category, from, to);
    const cacheKey = statsCacheKey("timeseries", district, category, from, to);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    let result;
    if (hasFilters) {
      const q = await pool.query(
        `SELECT
           date::text AS date,
           COUNT(*)::int AS count
         FROM meldungen
         ${where}
         GROUP BY date
         ORDER BY date ASC`,
        values,
      );
      result = q.rows;
    } else {
      const q = await pool.query(`
        SELECT
          day::text AS date,
          SUM(count)::int AS count
        FROM stats_daily
        WHERE day >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day ASC
      `);
      result = q.rows;
    }

    await cacheSet(cacheKey, JSON.stringify(result), 60 * 60);
    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/districts
router.get("/districts", async (request, res, next) => {
  try {
    const district = getStringParam(request.query.district);
    const category = getStringParam(request.query.category);
    const from = getStringParam(request.query.from);
    const to = getStringParam(request.query.to);
    const { where, values, hasFilters } = buildStatsFilter(district, category, from, to);
    const cacheKey = statsCacheKey("districts", district, category, from, to);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    let result;
    if (hasFilters) {
      const q = await pool.query(
        `SELECT district, COUNT(*)::int AS count
         FROM meldungen
         ${where}
         GROUP BY district
         ORDER BY count DESC`,
        values,
      );
      result = q.rows;
    } else {
      const q = await pool.query(`
        SELECT
          district,
          SUM(count)::int AS count
        FROM stats_totals
        GROUP BY district
        ORDER BY count DESC
      `);
      result = q.rows;
    }

    await cacheSet(cacheKey, JSON.stringify(result), 5 * 60);
    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/categories
router.get("/categories", async (request, res, next) => {
  try {
    const district = getStringParam(request.query.district);
    const category = getStringParam(request.query.category);
    const from = getStringParam(request.query.from);
    const to = getStringParam(request.query.to);
    const { where, values, hasFilters } = buildStatsFilter(district, category, from, to);
    const cacheKey = statsCacheKey("categories", district, category, from, to);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    let result;
    if (hasFilters) {
      const q = await pool.query(
        `SELECT category, COUNT(*)::int AS count
         FROM meldungen
         ${where}
         GROUP BY category
         ORDER BY count DESC`,
        values,
      );
      result = q.rows;
    } else {
      const q = await pool.query(`
        SELECT
          category,
          SUM(count)::int AS count
        FROM stats_totals
        GROUP BY category
        ORDER BY count DESC
      `);
      result = q.rows;
    }

    await cacheSet(cacheKey, JSON.stringify(result), 5 * 60);
    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
