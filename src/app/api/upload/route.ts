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
    const dateCol = headers.find((h) => h.includes("日期") || h.includes("date")) || headers[0];
    const descCol = headers.find((h) => h.includes("說明") || h.includes("description")) || headers[1];
    const amountCol = headers.find((h) => h.includes("支出") || h.includes("金額") || h.includes("amount")) || headers[2];

    const insertedCount = { count: 0 };

    for (const row of results.data as Record<string, string>[]) {
      const date = row[dateCol];
      const description = row[descCol] || "";
      const amountStr = (row[amountCol] || "0").replace(/[,$]/g, "");
      const amount = parseFloat(amountStr);

      if (!date || !description || isNaN(amount)) continue;

      const normalizedAmount = amount < 0 ? amount.toString() : (-amount).toString();
      const type = amount >= 0 ? "income" : "expense";

      await db.insert(transactions).values({
        clerkUserId: userId,
        accountId: accountId || null,
        originalDate: date,
        originalDescription: description,
        originalAmount: Math.abs(amount).toFixed(2),
        normalizedAmount,
        transactionType: type,
        rawCsvData: JSON.stringify(row),
      });

      insertedCount.count++;
    }

    return NextResponse.json({
      success: true,
      message: `成功匯入 ${insertedCount.count} 筆交易`,
      count: insertedCount.count,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "上傳失敗", details: String(error) },
      { status: 500 }
    );
  }
}
