import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withUserDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [
      eq(transactions.clerkUserId, userId),
    ];
    if (startDate) conditions.push(gte(transactions.originalDate, startDate));
    if (endDate) conditions.push(lte(transactions.originalDate, endDate));

    const results = await withUserDb(userId, async (db) =>
      db
        .select({
          month: sql<string>`TO_CHAR(original_date::date, 'YYYY-MM')`,
          totalExpense: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN normalized_amount::numeric ELSE 0 END), 0)`,
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN normalized_amount::numeric ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(and(...conditions))
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
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
