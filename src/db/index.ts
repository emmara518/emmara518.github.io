import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { SCHEMA_SQL } from "./init-sql";
import { isDemoSeedAllowed, seedDatabase } from "./seed";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const isProductionRuntime = process.env.NODE_ENV === "production" && !isBuildPhase;

const isPlaceholderUrl = (url?: string) => {
  if (!url || !url.trim()) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("@host:") ||
    lower.includes("//host:") ||
    lower.includes("user:password@") ||
    lower.includes("placeholder") ||
    lower.includes("example.com") ||
    lower.includes("app_db") ||
    lower.includes("localhost:5432") ||
    lower.includes("127.0.0.1:5432")
  );
};

let pool: Pool | null = null;
let dbInstance: any = null;
let dbInitError: Error | null = null;

const globalForDb = globalThis as typeof globalThis & {
  __drosMathDbInstance?: any;
  __drosMathPool?: Pool;
  __drosMathPglite?: PGlite;
  __drosMathInitPromise?: Promise<void>;
};

if (globalForDb.__drosMathDbInstance) {
  dbInstance = globalForDb.__drosMathDbInstance;
  pool = globalForDb.__drosMathPool ?? null;
} else if (databaseUrl && !isPlaceholderUrl(databaseUrl)) {
  try {
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    // Serverless (Vercel) runs many short-lived instances. The node-postgres
    // default pool (max=10, 10s idle) lets a handful of instances hold more
    // clients than the database/serverless pooler allows — Supabase rejects
    // the 16th client with `EMAXCONNSESSION: max clients reached in session
    // mode ... pool_size: 15`, which surfaced as the Settings crash and as
    // spurious logouts. One client per instance + fast idle release keeps the
    // total comfortably under the cap.
    const isServerless = Boolean(process.env.VERCEL);
    pool = new Pool({
      connectionString: databaseUrl,
      max: isServerless ? 1 : 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
      allowExitOnIdle: true,
      ssl: isLocal ? undefined : { rejectUnauthorized: true },
    });
    dbInstance = drizzleNodePg(pool, { schema });
    globalForDb.__drosMathPool = pool;
    globalForDb.__drosMathDbInstance = dbInstance;

    if (!globalForDb.__drosMathInitPromise) {
      globalForDb.__drosMathInitPromise = (async () => {
        try {
          if (pool) {
            if (process.env.NODE_ENV !== "production") {
              await pool.query(SCHEMA_SQL);
            }
            if (!isDemoSeedAllowed()) {
              // Demo seeding is restricted to explicit development/test runs.
              // Production schema changes must go through the explicit migration process.
              const { rows } = await pool.query(
                "SELECT (SELECT count(*)::int FROM users) AS users, (SELECT count(*)::int FROM courses) AS courses",
              );
              if ((rows[0]?.users ?? 0) === 0) {
                console.error(
                  "[db] DATABASE IS EMPTY — demo seeding is disabled outside development/test.",
                );
              } else {
                console.log("[db] External PostgreSQL initialized (demo seeding disabled)");
              }
            } else {
              await seedDatabase(dbInstance);
              console.log("[db] External PostgreSQL initialized & seeded successfully");
            }
          }
        } catch (err: any) {
          if (isProductionRuntime) {
            dbInitError = err instanceof Error ? err : new Error("Database schema verification failed");
          }
          console.warn("[db] External database migration/seed check:", err?.message || err);
        }
      })();
    }
  } catch (err) {
    if (isProductionRuntime) {
      dbInitError = err instanceof Error ? err : new Error("Database initialization failed");
      console.error("[db] Database initialization failed; embedded fallback is disabled in production.");
    } else {
      console.warn("[db] Failed to initialize Pool with DATABASE_URL, falling back to embedded PGlite:", err);
    }
  }
}

if (!dbInstance && isProductionRuntime) {
  dbInitError = dbInitError ?? new Error("DATABASE_URL is required in production");
  console.error("[db] Production database is not configured; refusing embedded fallback.");
} else if (!dbInstance) {
  const pgliteDataDir = process.env.PGLITE_DATA_DIR?.trim();
  const pglite = globalForDb.__drosMathPglite ?? new PGlite(pgliteDataDir || undefined);
  globalForDb.__drosMathPglite = pglite;
  dbInstance = drizzlePglite(pglite, { schema });
  globalForDb.__drosMathDbInstance = dbInstance;

  if (!globalForDb.__drosMathInitPromise) {
    globalForDb.__drosMathInitPromise = (async () => {
      try {
        await pglite.exec(SCHEMA_SQL);
        if (isDemoSeedAllowed()) {
          await seedDatabase(dbInstance);
          console.log("[db] Embedded database initialized & seeded successfully");
        } else {
          console.log("[db] Embedded database initialized (demo seeding disabled)");
        }
      } catch (err: any) {
        if (!err.message?.includes("already exists")) {
          console.error("[db] Error initializing embedded database:", err);
        }
      }
    })();
  }
}

export async function ensureDbReady(): Promise<void> {
  if (dbInitError) throw dbInitError;
  if (globalForDb.__drosMathInitPromise) {
    await globalForDb.__drosMathInitPromise;
  }
  if (dbInitError) throw dbInitError;
}

export { pool };

// Export a proxy for `db` that awaits DB initialization before executing query builders
function wrapWithInitCheck<T>(target: T): T {
  return new Proxy(target as any, {
    get(obj, prop, receiver) {
      if (dbInitError) throw dbInitError;
      const orig = Reflect.get(obj, prop, receiver);
      if (typeof orig === "function") {
        return function (...args: any[]) {
          const result = orig.apply(obj, args);
          if (result && typeof result === "object") {
            if (typeof result.then === "function") {
              const originalThen = result.then.bind(result);
              result.then = function (onFulfilled: any, onRejected: any) {
                if (globalForDb.__drosMathInitPromise) {
                  return globalForDb.__drosMathInitPromise.then(() => originalThen(onFulfilled, onRejected), onRejected);
                }
                return originalThen(onFulfilled, onRejected);
              };
            }
            return wrapWithInitCheck(result);
          }
          return result;
        };
      }
      return orig;
    },
  });
}

export const db = wrapWithInitCheck(dbInstance ?? {}) as ReturnType<typeof drizzleNodePg>;
