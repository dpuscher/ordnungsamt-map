import { OA_API_URL, OAResponseSchema, OAMeldungDetailSchema } from "@ordnungsamt/shared";
import type { OAMeldung, OAMeldungDetail } from "@ordnungsamt/shared";

const RETRY_DELAYS_MS = [30_000, 60_000, 120_000];
const DETAIL_CONCURRENCY = 10; // parallel detail fetches
const DETAIL_BATCH_DELAY_MS = 200; // pause between batches to be polite
const BULK_FETCH_TIMEOUT_MS = Number.parseInt(process.env.OA_BULK_FETCH_TIMEOUT_MS ?? "600000", 10);
const DETAIL_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.OA_DETAIL_FETCH_TIMEOUT_MS ?? "15000",
  10,
);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getIndexItems(value: unknown): unknown[] {
  if (typeof value !== "object" || value === null || !("index" in value)) {
    return [];
  }

  const { index } = value as { index: unknown };
  return Array.isArray(index) ? index : [];
}

async function fetchWithRetry(url: string, timeoutMs = 30_000): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (error) {
      lastError = error;
      const delayMs = RETRY_DELAYS_MS[attempt];
      if (delayMs !== undefined) {
        await sleep(delayMs);
      }
    }
  }
  throw lastError;
}

/** Fetch the full bulk list of meldungen (no coordinates). */
async function fetchBulk(): Promise<OAMeldung[]> {
  const res = await fetchWithRetry(OA_API_URL, BULK_FETCH_TIMEOUT_MS);
  const raw = await res.json();
  const parsed = OAResponseSchema.safeParse(raw);

  if (!parsed.success) {
    console.warn("[fetch] Zod validation issues on bulk:", parsed.error.issues.slice(0, 3));
    const items = getIndexItems(raw);
    return items.filter((item): item is OAMeldung => {
      return OAResponseSchema.shape.index.element.safeParse(item).success;
    });
  }

  return parsed.data.index;
}

/** Fetch detail for a single meldung ID — returns null on failure. */
async function fetchDetail(id: number): Promise<OAMeldungDetail | null> {
  try {
    const url = `${OA_API_URL}/${id}`;
    const res = await fetchWithRetry(url, DETAIL_FETCH_TIMEOUT_MS);
    const raw = await res.json();
    const items = getIndexItems(raw);
    if (items.length === 0) return null;
    const parsed = OAMeldungDetailSchema.safeParse(items[0]);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Fetch detail records for IDs we don't yet have coordinates for.
 * Runs in batches of DETAIL_CONCURRENCY to avoid hammering the API.
 */
export async function fetchDetails(
  ids: number[],
  onProgress?: (done: number, total: number) => void,
): Promise<Map<number, OAMeldungDetail>> {
  const result = new Map<number, OAMeldungDetail>();
  let done = 0;

  for (let i = 0; i < ids.length; i += DETAIL_CONCURRENCY) {
    const batch = ids.slice(i, i + DETAIL_CONCURRENCY);
    const details = await Promise.all(batch.map(id => fetchDetail(id)));
    for (const [j, element] of batch.entries()) {
      const detail = details[j];
      if (detail?.lat != null && detail?.lng != null) {
        result.set(element, detail);
      }
    }
    done += batch.length;
    onProgress?.(done, ids.length);
    if (i + DETAIL_CONCURRENCY < ids.length) {
      await sleep(DETAIL_BATCH_DELAY_MS);
    }
  }

  return result;
}

/** Main entry: fetch bulk list. */
export async function fetchMeldungen(): Promise<OAMeldung[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      const data = await fetchBulk();
      console.log(`[fetch] Got ${data.length} records (attempt ${attempt + 1})`);
      return data;
    } catch (error) {
      lastError = error;
      const delayMs = RETRY_DELAYS_MS[attempt];
      if (delayMs !== undefined) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(
          `[fetch] Attempt ${attempt + 1} failed: ${errorMessage}. Retrying in ${delayMs / 1000}s...`,
        );
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}
