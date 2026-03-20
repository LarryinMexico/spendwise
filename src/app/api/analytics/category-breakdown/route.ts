import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This month's first day
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const startOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;

    // normalized_amount is always positive; transaction_type = 'expense' tells us it's spending
    const results = await db
      .select({
        category: sql<string>`COALESCE(ai_category, '未分類')`,
        total: sql<string>`COALESCE(SUM(normalized_amount::numeric), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.clerkUserId, userId),
          eq(transactions.transactionType, "expense"),
          gte(transactions.originalDate, startOfMonth)
        )
      )
      .groupBy(sql`COALESCE(ai_category, '未分類')`)
      .orderBy(sql`SUM(normalized_amount::numeric) DESC`);

    const data = results
      .filter((r) => Number(r.total) > 0)
      .map((r) => ({
        category: r.category,
        value: Math.round(Number(r.total) * 100) / 100,
      }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Category breakdown error:", error);
    return NextResponse.json(
      { error: "取得分類失敗" },
      { status: 500 }
    );
  }
}
