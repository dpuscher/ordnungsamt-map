import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import type { TransformedMeldung } from "./transform.js";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const UPSERT_BATCH_SIZE = Number.parseInt(process.env.COLLECTOR_UPSERT_BATCH_SIZE ?? "500", 10);

export async function runMigrations(): Promise<void> {
  const sql = readFileSync(path.join(__dirname, "migrations", "001_schema.sql"), "utf8");
  await pool.query(sql);
  console.log("[db] Migrations applied.");
}

/** Returns the set of all IDs already stored in the DB. */
export async function getExistingIds(): Promise<Set<string>> {
  const result = await pool.query(`SELECT id FROM meldungen`);
  return new Set(result.rows.map((r: { id: string }) => r.id));
}

export interface UpsertResult {
  inserted: number;
  updated: number;
  failed: number;
}

async function upsertOne(
  client: pg.PoolClient,
  meldung: TransformedMeldung,
): Promise<"inserted" | "updated"> {
  const locationWKT = `SRID=4326;POINT(${meldung.lng} ${meldung.lat})`;
  const result = await client.query<{ was_inserted: boolean }>(
    `INSERT INTO meldungen (
      id, date, category, subcategory, district, status,
      description, location,
      report_number, street, house_number, postal_code,
      location_note, last_changed, feedback,
      raw_json, first_seen_at, last_seen_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      ST_GeogFromText($8),
      $9, $10, $11, $12, $13, $14, $15,
      $16, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      last_seen_at  = NOW(),
      status        = EXCLUDED.status,
      description   = EXCLUDED.description,
      category      = EXCLUDED.category,
      subcategory   = EXCLUDED.subcategory,
      district      = EXCLUDED.district,
      location      = EXCLUDED.location,
      report_number = EXCLUDED.report_number,
      street        = EXCLUDED.street,
      house_number  = EXCLUDED.house_number,
      postal_code   = EXCLUDED.postal_code,
      location_note = EXCLUDED.location_note,
      last_changed  = EXCLUDED.last_changed,
      feedback      = EXCLUDED.feedback,
      raw_json      = EXCLUDED.raw_json
    RETURNING (xmax = 0) AS was_inserted`,
    [
      meldung.id,
      meldung.date,
      meldung.category,
      meldung.subcategory,
      meldung.district,
      meldung.status,
      meldung.description,
      locationWKT,
      meldung.reportNumber,
      meldung.street,
      meldung.houseNumber,
      meldung.postalCode,
      meldung.locationNote,
      meldung.lastChanged,
      meldung.feedback,
      JSON.stringify(meldung),
    ],
  );

  return result.rows[0]?.was_inserted ? "inserted" : "updated";
}

export async function upsertMeldungen(meldungen: TransformedMeldung[]): Promise<UpsertResult> {
  const client = await pool.connect();
  try {
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (let index = 0; index < meldungen.length; index += UPSERT_BATCH_SIZE) {
      const batch = meldungen.slice(index, index + UPSERT_BATCH_SIZE);

      try {
        await client.query("BEGIN");

        for (const meldung of batch) {
          const outcome = await upsertOne(client, meldung);
          if (outcome === "inserted") {
            inserted++;
          } else {
            updated++;
          }
        }

        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(
          `[db] Upsert batch ${index + 1}-${index + batch.length} failed (${errorMessage}). Retrying rows individually.`,
        );

        for (const meldung of batch) {
          try {
            const outcome = await upsertOne(client, meldung);
            if (outcome === "inserted") {
              inserted++;
            } else {
              updated++;
            }
          } catch (rowError) {
            failed++;
            const rowErrorMessage = rowError instanceof Error ? rowError.message : String(rowError);
            console.error(`[db] Failed to upsert meldung ${meldung.id}: ${rowErrorMessage}`);
          }
        }
      }
    }

    return { inserted, updated, failed };
  } finally {
    client.release();
  }
}

export async function refreshMaterializedViews(): Promise<void> {
  await pool
    .query("REFRESH MATERIALIZED VIEW CONCURRENTLY stats_daily")
    .catch(() => pool.query("REFRESH MATERIALIZED VIEW stats_daily"));
  await pool
    .query("REFRESH MATERIALIZED VIEW CONCURRENTLY stats_totals")
    .catch(() => pool.query("REFRESH MATERIALIZED VIEW stats_totals"));
  console.log("[db] Materialized views refreshed.");
}

export async function logRun(params: {
  startedAt: Date;
  finishedAt?: Date;
  fetched?: number;
  inserted?: number;
  updated?: number;
  error?: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO logs_collector
       (started_at, finished_at, fetched, inserted, updated, error)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      params.startedAt,
      params.finishedAt ?? null,
      params.fetched ?? null,
      params.inserted ?? null,
      params.updated ?? null,
      params.error ?? null,
    ],
  );
}

export { pool };
