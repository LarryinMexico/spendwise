import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withUserDb } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { categorizeTransactions } from "@/lib/ai/categorizer";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const transactionIds = body.transactionIds as string[] | undefined;

    // Fetch pending transactions within an RLS-enabled transaction session
    const targetTransactions = await withUserDb(userId, async (db) => {
      const conditions = [
        eq(transactions.clerkUserId, userId),
        eq(transactions.status, "pending"),
      ];

      if (transactionIds && transactionIds.length > 0) {
        conditions.push(inArray(transactions.id, transactionIds));
      }

      return db
        .select({
          id: transactions.id,
          originalDescription: transactions.originalDescription,
        })
        .from(transactions)
        .where(and(...conditions))
        // Batch limit for classification load balancing
        .limit(30);
    });

    if (targetTransactions.length === 0) {
      return NextResponse.json({ message: "沒有待分類的交易", count: 0 });
    }

    // Call AI engine to generate categories
    const results = await categorizeTransactions(targetTransactions);

    if (results.size === 0) {
      return NextResponse.json({ message: "AI 無法對該批交易進行分類", count: 0 });
    }

    // Write-back classification results using RLS sub-sessions
    await withUserDb(userId, async (db) => {
      for (const [id, result] of results) {
        await db
          .update(transactions)
          .set({
            aiCategory: result.category,
            aiCategoryConfidence: result.confidence.toString(),
            status: "categorized",
            autoClassifiedAt: new Date(),
          })
          .where(and(eq(transactions.id, id), eq(transactions.clerkUserId, userId)));
      }
    });

    return NextResponse.json({
      message: `成功分類 ${results.size} 筆交易`,
      count: results.size,
    });
  } catch (error) {
    console.error("Categorize error:", error);
    return NextResponse.json({ error: "分類失敗", details: String(error) }, { status: 500 });
  }
}
