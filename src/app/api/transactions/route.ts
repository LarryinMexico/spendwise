import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count } = await db
      .delete(transactions)
      .where(eq(transactions.clerkUserId, userId));

    return NextResponse.json({
      success: true,
      message: `已刪除 ${count} 筆記錄`,
      count,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "刪除失敗" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [eq(transactions.clerkUserId, userId)];

    if (startDate) {
      conditions.push(gte(transactions.originalDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(transactions.originalDate, endDate));
    }

    const results = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.originalDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ transactions: results });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "取得交易失敗" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, originalDate, originalDescription, originalAmount } = body;

    const amount = parseFloat(originalAmount);
    const normalizedAmount = amount < 0 
      ? originalAmount 
      : (-amount).toString();
    const type = amount >= 0 ? "income" : "expense";

    const [newTransaction] = await db
      .insert(transactions)
      .values({
        clerkUserId: userId,
        accountId: accountId || null,
        originalDate: originalDate,
        originalDescription,
        originalAmount: Math.abs(amount).toFixed(2),
        normalizedAmount,
        transactionType: type,
      })
      .returning();

    return NextResponse.json({ transaction: newTransaction });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "建立交易失敗" },
      { status: 500 }
    );
  }
}
