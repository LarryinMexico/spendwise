import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const accountId = formData.get("accountId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const Papa = (await import("papaparse")).default;

    const text = await file.text();
    const results = Papa.parse(text, { header: true });

    const headers = results.meta.fields || [];

    const dateCol = headers.find(
      (h) => h.includes("日期") || h.includes("date") || h.includes("日期")
    ) || headers[0];
    const descCol =
      headers.find(
        (h) => h.includes("說明") || h.includes("description") || h.includes("摘要")
      ) || headers[1];
    const expenseCol = headers.find(
      (h) => h.includes("支出") || h.includes("debit")
    );
    const incomeCol = headers.find(
      (h) => h.includes("存入") || h.includes("credit")
    );

    let insertedCount = 0;

    for (const row of results.data as Record<string, string>[]) {
      const date = row[dateCol]?.trim();
      const description = row[descCol]?.trim() || "";

      if (!date || !description) continue;

      const expenseStr = expenseCol ? (row[expenseCol] || "0").replace(/[,$]/g, "") : null;
      const incomeStr = incomeCol ? (row[incomeCol] || "0").replace(/[,$]/g, "") : null;

      // CSV 支出格式可能帶負號（如 -85）或為正數，需要取絕對值
      const expenseAmount = expenseStr ? Math.abs(parseFloat(expenseStr)) : 0;
      const incomeAmount = incomeStr ? Math.abs(parseFloat(incomeStr)) : 0;

      if (expenseAmount === 0 && incomeAmount === 0) continue;

      const isIncome = incomeAmount > 0;
      // normalizedAmount 永遠存正數，用 transaction_type 區分方向
      const amount = isIncome ? incomeAmount : expenseAmount;
      const normalizedAmount = amount.toFixed(2);
      const type = isIncome ? "income" : "expense";

      await db.insert(transactions).values({
        clerkUserId: userId,
        accountId: accountId || null,
        originalDate: date,
        originalDescription: description,
        originalAmount: amount.toFixed(2),
        normalizedAmount,
        transactionType: type,
        rawCsvData: JSON.stringify(row),
      });

      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `成功匯入 ${insertedCount} 筆交易`,
      count: insertedCount,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "上傳失敗", details: String(error) },
      { status: 500 }
    );
  }
}
