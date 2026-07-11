// Lazy singleton DuckDB-WASM instance. Everything runs in the browser — the
// Parquet file is fetched once and queried client-side, so the dashboard needs
// no backend, database, or API. Bundles are pulled from jsDelivr per the
// official duckdb-wasm quickstart.
import * as duckdb from "@duckdb/duckdb-wasm";

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let ready: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function initDB(): Promise<duckdb.AsyncDuckDB> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker ?? undefined);
  URL.revokeObjectURL(workerUrl);
  return db;
}

/** Returns a connection with an `orders` view over the committed Parquet file. */
export function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (ready) return ready;
  ready = (async () => {
    dbPromise ??= initDB();
    const db = await dbPromise;
    const res = await fetch("/data/orders.parquet");
    const buf = new Uint8Array(await res.arrayBuffer());
    await db.registerFileBuffer("orders.parquet", buf);
    const conn = await db.connect();
    await conn.query("CREATE VIEW orders AS SELECT * FROM parquet_scan('orders.parquet')");
    return conn;
  })();
  return ready;
}

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const conn = await getConnection();
  const result = await conn.query(sql);
  return result.toArray().map((row) => row.toJSON() as T);
}
