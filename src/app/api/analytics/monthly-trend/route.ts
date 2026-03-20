import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withUserDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get("months") || "6");

    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - (months - 1));
    const pad = (n: number) => n.toString().padStart(2, "0");
    const startDate = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`;

    const results = await withUserDb(userId, async (db) =>
      db
        .select({
          month: sql<string>`TO_CHAR(original_date::date, 'YYYY-MM')`,
          totalExpense: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN normalized_amount::numeric ELSE 0 END), 0)`,
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN normalized_amount::numeric ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.clerkUserId, userId),
            gte(transactions.originalDate, startDate)
          )
        )
        .groupBy(sql`TO_CHAR(original_date::date, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(original_date::date, 'YYYY-MM')`)
    );

    const data = results.map((r) => ({
      month: r.month,
      expense: Math.abs(Number(r.totalExpense)),
      income: Math.abs(Number(r.totalIncome)),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Monthly trend error:", error);
    return NextResponse.json({ error: "取得趨勢失敗" }, { status: 500 });
  }
}
