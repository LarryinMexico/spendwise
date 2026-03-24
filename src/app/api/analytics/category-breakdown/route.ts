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
      eq(transactions.transactionType, "expense"),
    ];
    if (startDate) conditions.push(gte(transactions.originalDate, startDate));
    if (endDate) conditions.push(lte(transactions.originalDate, endDate));

    const results = await withUserDb(userId, async (db) =>
      db
        .select({
          category: sql<string>`COALESCE(ai_category, 'Uncategorized')`,
          total: sql<string>`COALESCE(SUM(normalized_amount::numeric), 0)`,
        })
        .from(transactions)
        .where(and(...conditions))
        .groupBy(sql`COALESCE(ai_category, 'Uncategorized')`)
        .orderBy(sql`SUM(normalized_amount::numeric) DESC`)
    );

    const data = results
      .filter((r) => Number(r.total) > 0)
      .map((r) => ({
        category: r.category,
        value: Math.round(Number(r.total) * 100) / 100,
      }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Category breakdown error:", error);
    return NextResponse.json({ error: "Failed to get category breakdown" }, { status: 500 });
  }
}
