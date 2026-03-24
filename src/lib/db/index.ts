import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

export const sqlClient = postgres(connectionString, { prepare: false });
export const db = drizzle(sqlClient, { schema });

/**
 * 在 Drizzle Transaction 內執行查詢，並注入 Clerk userId。
 * 這是保護 RLS 行級安全政策（Policies）唯一的正確方法。
 */
export async function withUserDb<T>(
  userId: string,
  fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // 透過 Drizzle 的 tx.execute 呼叫，安全不報錯
    const userIdEscaped = userId.replace(/'/g, "''");
    await tx.execute(sql.raw(`SELECT set_config('app.current_user_id', '${userIdEscaped}', true)`));
    return fn(tx);
  });
}

/**
 * 專供 AI Query使用的 Raw SQL 管道。
 */
export async function withUserRawSql(
  userId: string,
  rawSql: string
): Promise<Record<string, unknown>[]> {
  // AI 查純 SQL 則用底層 sqlClient 的 begin，這部分是純底層運作
  const result = await sqlClient.begin(async (tx) => {
    await tx.unsafe(`SELECT set_config('app.current_user_id', '${userId.replace(/'/g, "''")}', true)`);
    return tx.unsafe(rawSql);
  });
  return result as Record<string, unknown>[];
}
