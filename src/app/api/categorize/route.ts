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
      return NextResponse.json({ message: "No transactions pending categorization", count: 0 });
    }

    // Call AI engine to generate categories
    const results = await categorizeTransactions(targetTransactions);

    if (results.size === 0) {
      return NextResponse.json({ message: "AI unable to categorize this batch of transactions", count: 0 });
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
      message: `Successfully categorized ${results.size} Transactions`,
      count: results.size,
    });
  } catch (error) {
    console.error("Categorize error:", error);
    return NextResponse.json({ error: "Categorize Failed", details: String(error) }, { status: 500 });
  }
}
