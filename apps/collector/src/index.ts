import cron from "node-cron";
import {
  runMigrations,
  upsertMeldungen,
  refreshMaterializedViews,
  logRun,
  getExistingIds,
} from "./db.js";
import { fetchMeldungen, fetchDetails } from "./fetch.js";
import { transformMeldung } from "./transform.js";
import type { TransformedMeldung } from "./transform.js";

const intervalMinutes = Number.parseInt(process.env.COLLECTOR_INTERVAL_MINUTES ?? "15", 10);
const processBatchSize = Number.parseInt(process.env.COLLECTOR_PROCESS_BATCH_SIZE ?? "500", 10);

async function runCollector(): Promise<void> {
  const startedAt = new Date();
  console.log(`[collector] Run started at ${startedAt.toISOString()}`);

  try {
    // 1. Fetch the full bulk list (IDs + metadata, no coordinates)
    const raw = await fetchMeldungen();

    // 2. Find IDs not yet in the DB — only those need detail fetches
    const existingIds = await getExistingIds();
    const newItems = raw.filter(item => !existingIds.has(String(item.id)));

    console.log(`[collector] ${newItems.length} new records out of ${raw.length} total`);

    let withCoords = 0;
    let inserted = 0;
    let updated = 0;
    let failed = 0;
    let fetchedDetails = 0;

    // 3. Fetch detail (with real lat/lng) and upsert incrementally for new IDs
    for (let index = 0; index < newItems.length; index += processBatchSize) {
      const batch = newItems.slice(index, index + processBatchSize);
      const batchStart = index + 1;
      const batchEnd = index + batch.length;

      console.log(
        `[collector] Processing batch ${batchStart}-${batchEnd}/${newItems.length} (${batch.length} records)`,
      );

      const details = await fetchDetails(
        batch.map(item => item.id),
        (done, total) => {
          if (done === total) {
            console.log(
              `[collector] Detail fetch: ${fetchedDetails + done}/${newItems.length} new records`,
            );
          }
        },
      );

      fetchedDetails += batch.length;
      console.log(
        `[collector] Batch ${batchStart}-${batchEnd}: got coordinates for ${details.size}/${batch.length}`,
      );

      const meldungen = batch
        .map(item => transformMeldung(item, details.get(item.id)))
        .filter((meldung): meldung is TransformedMeldung => meldung !== null);

      withCoords += meldungen.length;

      if (meldungen.length === 0) {
        continue;
      }

      const upsertResult = await upsertMeldungen(meldungen);
      inserted += upsertResult.inserted;
      updated += upsertResult.updated;
      failed += upsertResult.failed;

      console.log(
        `[collector] Batch ${batchStart}-${batchEnd}: upserted=${meldungen.length} inserted=${inserted} updated=${updated} failed=${failed}`,
      );
    }

    console.log(`[collector] ${withCoords} new records with coordinates processed`);

    // 4. Refresh materialized views
    await refreshMaterializedViews();

    const finishedAt = new Date();
    await logRun({
      startedAt,
      finishedAt,
      fetched: raw.length,
      inserted,
      updated,
      error: failed > 0 ? `${failed} rows failed during upsert` : undefined,
    });

    console.log(
      `[collector] Done. fetched=${raw.length} withCoords=${withCoords} inserted=${inserted} updated=${updated} failed=${failed}`,
    );
  } catch (error) {
    const finishedAt = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[collector] Run failed: ${errorMessage}`);
    await logRun({ startedAt, finishedAt, error: errorMessage }).catch(() => {});
  }
}

async function main(): Promise<void> {
  console.log("[collector] Starting...");
  await runMigrations();
  await runCollector();

  const cronExpression = `*/${intervalMinutes} * * * *`;
  console.log(`[collector] Scheduling runs every ${intervalMinutes} minutes (${cronExpression})`);
  cron.schedule(cronExpression, runCollector);
}

try {
  await main();
} catch (error) {
  console.error("[collector] Fatal error:", error);
  throw error;
}
