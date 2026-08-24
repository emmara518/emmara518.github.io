import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { SCHEMA_SQL } from "./init-sql";
import { seedDatabase } from "./seed";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

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
    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
    dbInstance = drizzleNodePg(pool, { schema });
    globalForDb.__drosMathPool = pool;
    globalForDb.__drosMathDbInstance = dbInstance;

    if (!globalForDb.__drosMathInitPromise) {
      globalForDb.__drosMathInitPromise = (async () => {
        try {
          if (pool) {
            await pool.query(SCHEMA_SQL);
            await seedDatabase(dbInstance);
            console.log("[db] External PostgreSQL initialized & seeded successfully");
          }
        } catch (err: any) {
          console.warn("[db] External database migration/seed check:", err?.message || err);
        }
      })();
    }
  } catch (err) {
    console.warn("[db] Failed to initialize Pool with DATABASE_URL, falling back to embedded PGlite:", err);
  }
}

if (!dbInstance) {
  const pglite = globalForDb.__drosMathPglite ?? new PGlite();
  globalForDb.__drosMathPglite = pglite;
  dbInstance = drizzlePglite(pglite, { schema });
  globalForDb.__drosMathDbInstance = dbInstance;

  if (!globalForDb.__drosMathInitPromise) {
    globalForDb.__drosMathInitPromise = (async () => {
      try {
        await pglite.exec(SCHEMA_SQL);
        await seedDatabase(dbInstance);
        console.log("[db] Embedded database initialized & seeded successfully");
      } catch (err: any) {
        if (!err.message?.includes("already exists")) {
          console.error("[db] Error initializing embedded database:", err);
        }
      }
    })();
  }
}

export async function ensureDbReady(): Promise<void> {
  if (globalForDb.__drosMathInitPromise) {
    await globalForDb.__drosMathInitPromise;
  }
}

export { pool };

// Export a proxy for `db` that awaits DB initialization before executing query builders
function wrapWithInitCheck<T>(target: T): T {
  return new Proxy(target as any, {
    get(obj, prop, receiver) {
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

export const db = wrapWithInitCheck(dbInstance) as ReturnType<typeof drizzleNodePg>;
