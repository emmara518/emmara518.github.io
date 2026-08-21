import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const isBuildTime = process.env.NODE_ENV === "production" && !databaseUrl && process.env.NEXT_PHASE === "phase-production-build";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

if (!isBuildTime) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const globalForDb = globalThis as typeof globalThis & {
    __arenaNextJsPostgresqlPool?: Pool;
  };

  pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  dbInstance = drizzle(pool);
}

// Mock db for build time - throws if actually used
const createMockDb = () => {
  const handler = {
    get() {
      throw new Error("Database not available during build. Use dynamic rendering or provide DATABASE_URL.");
    },
  };
  return new Proxy({}, handler) as ReturnType<typeof drizzle>;
};

export { pool };
export const db = (dbInstance ?? createMockDb()) as ReturnType<typeof drizzle>;