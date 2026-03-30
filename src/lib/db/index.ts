import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

export const sqlClient = postgres(connectionString, { prepare: false });
export const db = drizzle(sqlClient, { schema });

/**
 * 在 Drizzle Transaction 內執行查詢，並注入 Clerk userId。
 *
 * 安全機制（雙層防護）：
 * 1. SET LOCAL ROLE authenticated — 將 postgres superuser 降權為 authenticated，
 *    使 RLS policies 生效（superuser 預設繞過 RLS）。
 * 2. set_config('app.current_user_id', ...) — 設定 session 變數，
 *    讓 RLS policy 的 current_clerk_user_id() 能正確識別當前使用者。
 */
export async function withUserDb<T>(
  userId: string,
  fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // 降權為 authenticated role，啟用 RLS（使用 parameterized query 防止 injection）
    await tx.execute(sql`SET LOCAL ROLE authenticated`);
    // 注入 Clerk userId 供 RLS policy 使用
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    return fn(tx);
  });
}


/**
 * 專供 AI Query 使用的 Raw SQL 管道。
 * 同樣套用 SET LOCAL ROLE + app.current_user_id 雙層防護。
 */
export async function withUserRawSql(
  userId: string,
  rawSql: string
): Promise<Record<string, unknown>[]> {
  const result = await sqlClient.begin(async (tx) => {
    // 降權為 authenticated，啟用 RLS
    await tx.unsafe(`SET LOCAL ROLE authenticated`);
    // 設定 Clerk userId（TransactionSql 用 unsafe 傳參數）
    await tx.unsafe(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    return tx.unsafe(rawSql);
  });
  return result as Record<string, unknown>[];
}
