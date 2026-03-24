import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, sqlClient } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { categorizeTransactions } from "@/lib/ai/categorizer";

const BATCH_SIZE = 20;

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await sqlClient`SET LOCAL app.current_user_id = ${userId}`;

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
        message: "No transactions pending categorization",
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
      message: `Successfully categorized ${results.size} Transactions`,
      count: results.size,
    });
  } catch (error) {
    console.error("Categorize error:", error);
    return NextResponse.json(
      { error: "Categorize Failed", details: String(error) },
      { status: 500 }
    );
  }
}
