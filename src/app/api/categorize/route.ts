import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { categorizeTransactions } from "@/lib/ai/categorizer";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionIds } = await request.json();

    let targetTransactions;

    if (transactionIds && Array.isArray(transactionIds) && transactionIds.length > 0) {
      const allTx = await db
        .select({
          id: transactions.id,
          originalDescription: transactions.originalDescription,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.clerkUserId, userId),
            eq(transactions.status, "pending")
          )
        );

      targetTransactions = allTx.filter((t) =>
        transactionIds.includes(t.id)
      );
    } else {
      targetTransactions = await db
        .select({
          id: transactions.id,
          originalDescription: transactions.originalDescription,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.clerkUserId, userId),
            eq(transactions.status, "pending")
          )
        )
        .limit(20);
    }

    if (targetTransactions.length === 0) {
      return NextResponse.json({
        message: "沒有待分類的交易",
        count: 0,
      });
    }

    const results = await categorizeTransactions(targetTransactions);

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
