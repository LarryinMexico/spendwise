import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { categorizeTransactions } from "@/lib/ai/categorizer";

const BATCH_SIZE = 20;

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pendingTransactions = await db
      .select({
        id: transactions.id,
        originalDescription: transactions.originalDescription,
      })
      .from(transactions)
      .where(eq(transactions.clerkUserId, userId))
      .limit(BATCH_SIZE);

    if (pendingTransactions.length === 0) {
      return NextResponse.json({
        message: "沒有待分類的交易",
        count: 0,
      });
    }

    const results = await categorizeTransactions(pendingTransactions);

    for (const [id, result] of results) {
      await db
        .update(transactions)
        .set({
          aiCategory: result.category,
          aiCategoryConfidence: result.confidence.toString(),
          status: "categorized",
          autoClassifiedAt: new Date(),
        })
        .where(eq(transactions.id, id));
    }

    return NextResponse.json({
      message: `成功分類 ${results.size} 筆交易`,
      count: results.size,
    });
  } catch (error) {
    console.error("Categorize error:", error);
    return NextResponse.json(
      { error: "分類失敗", details: String(error) },
      { status: 500 }
    );
  }
}
