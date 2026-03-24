import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withUserDb } from "@/lib/db";
import { transactions, uploads } from "@/lib/db/schema";

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

    const dateCol =
      headers.find((h) => h.includes("Date") || h.toLowerCase().includes("date")) ||
      headers[0];
    const descCol =
      headers.find(
        (h) =>
          h.includes("Description") ||
          h.includes("Description") ||
          h.toLowerCase().includes("description")
      ) || headers[1];
    const expenseCol = headers.find((h) => h.includes("Expense") || h.toLowerCase().includes("debit"));
    const incomeCol = headers.find((h) => h.includes("Deposit") || h.toLowerCase().includes("credit"));

    const valuesToInsert: {
      clerkUserId: string;
      accountId: string | null;
      originalDate: string;
      originalDescription: string;
      originalAmount: string;
      normalizedAmount: string;
      transactionType: "income" | "expense";
      rawCsvData: string;
    }[] = [];

    let minDate = "";
    let maxDate = "";

    for (const row of results.data as Record<string, string>[]) {
      const date = row[dateCol]?.trim();
      const description = row[descCol]?.trim() || "";
      if (!date || !description) continue;

      const expenseStr = expenseCol ? (row[expenseCol] || "0").replace(/[,$]/g, "") : null;
      const incomeStr = incomeCol ? (row[incomeCol] || "0").replace(/[,$]/g, "") : null;

      const expenseAmount = expenseStr ? Math.abs(parseFloat(expenseStr)) : 0;
      const incomeAmount = incomeStr ? Math.abs(parseFloat(incomeStr)) : 0;

      if (expenseAmount === 0 && incomeAmount === 0) continue;

      const isIncome = incomeAmount > 0;
      const amount = isIncome ? incomeAmount : expenseAmount;
      const normalizedAmount = amount.toFixed(2);
      const type: "income" | "expense" = isIncome ? "income" : "expense";

      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date > maxDate) maxDate = date;

      valuesToInsert.push({
        clerkUserId: userId,
        accountId: accountId || null,
        originalDate: date,
        originalDescription: description,
        originalAmount: amount.toFixed(2),
        normalizedAmount,
        transactionType: type,
        rawCsvData: JSON.stringify(row),
      });
    }

    if (valuesToInsert.length === 0) {
      return NextResponse.json({ success: true, message: "No data to import", count: 0 });
    }

    let uploadId = "";

    await withUserDb(userId, async (db) => {
      const [upload] = await db
        .insert(uploads)
        .values({
          clerkUserId: userId,
          fileName: file.name,
          transactionCount: valuesToInsert.length,
          dateRangeStart: minDate || null,
          dateRangeEnd: maxDate || null,
        })
        .returning();

      uploadId = upload.id;

      const txWithUpload = valuesToInsert.map((v) => ({
        ...v,
        uploadId: upload.id,
      }));

      await db.insert(transactions).values(txWithUpload);
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${valuesToInsert.length} Transactions`,
      count: valuesToInsert.length,
      uploadId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed", details: String(error) }, { status: 500 });
  }
}
