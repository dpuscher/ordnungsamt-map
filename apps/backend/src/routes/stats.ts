import { Router } from "express";
import { pool } from "../db.js";
import { cacheGet, cacheSet } from "../cache.js";

const router = Router();

// GET /api/stats/overview
router.get("/overview", async (_request, res, next) => {
  try {
    const cached = await cacheGet("stats:overview");
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    const q = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM meldungen)::int                                AS total,
        (SELECT COUNT(DISTINCT district) FROM meldungen)::int                AS districts,
        (SELECT COUNT(*) FROM meldungen
          WHERE date >= date_trunc('day', NOW()))::int                       AS today,
        (SELECT COUNT(DISTINCT category) FROM meldungen)::int               AS categories,
        (SELECT MAX(finished_at) FROM logs_collector WHERE error IS NULL)    AS last_updated
    `);

    const result = q.rows[0];
    await cacheSet("stats:overview", JSON.stringify(result), 5 * 60);

    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/timeseries
router.get("/timeseries", async (_request, res, next) => {
  try {
    const cached = await cacheGet("stats:timeseries");
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    const q = await pool.query(`
      SELECT
        day::text AS date,
        SUM(count)::int AS count
      FROM stats_daily
      WHERE day >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `);

    const result = q.rows;
    await cacheSet("stats:timeseries", JSON.stringify(result), 60 * 60);

    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/districts
router.get("/districts", async (_request, res, next) => {
  try {
    const cached = await cacheGet("stats:districts");
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    const q = await pool.query(`
      SELECT
        district,
        SUM(count)::int AS count
      FROM stats_totals
      GROUP BY district
      ORDER BY count DESC
    `);

    const result = q.rows;
    await cacheSet("stats:districts", JSON.stringify(result), 5 * 60);

    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/categories
router.get("/categories", async (_request, res, next) => {
  try {
    const cached = await cacheGet("stats:categories");
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(JSON.parse(cached));
      return;
    }

    const q = await pool.query(`
      SELECT
        category,
        SUM(count)::int AS count
      FROM stats_totals
      GROUP BY category
      ORDER BY count DESC
    `);

    const result = q.rows;
    await cacheSet("stats:categories", JSON.stringify(result), 5 * 60);

    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
