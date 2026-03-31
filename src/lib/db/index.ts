import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

export const sqlClient = postgres(connectionString, { prepare: false });
export const db = drizzle(sqlClient, { schema });

/**
 * Execute queries within a Drizzle transaction with Clerk userId injection.
 *
 * Security mechanism (dual-layer protection):
 * 1. SET LOCAL ROLE authenticated — downgrades the postgres superuser to
 *    the 'authenticated' role, activating RLS policies (superuser bypasses RLS by default).
 * 2. set_config('app.current_user_id', ...) — sets a session variable so
 *    the RLS policy's current_clerk_user_id() function correctly identifies the current user.
 */
export async function withUserDb<T>(
  userId: string,
  fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Downgrade to authenticated role to activate RLS (parameterized to prevent injection)
    await tx.execute(sql`SET LOCAL ROLE authenticated`);
    // Inject Clerk userId for RLS policy evaluation
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    return fn(tx);
  });
}


/**
 * Raw SQL pipeline for AI Query engine.
 * Applies the same SET LOCAL ROLE + app.current_user_id dual-layer protection.
 */
export async function withUserRawSql(
  userId: string,
  rawSql: string
): Promise<Record<string, unknown>[]> {
  const result = await sqlClient.begin(async (tx) => {
    // Downgrade to authenticated role to activate RLS
    await tx.unsafe(`SET LOCAL ROLE authenticated`);
    // Set Clerk userId (using parameterized unsafe to prevent injection)
    await tx.unsafe(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    return tx.unsafe(rawSql);
  });
  return result as Record<string, unknown>[];
}
