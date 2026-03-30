import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withUserDb } from "@/lib/db";
import { transactions, uploads } from "@/lib/db/schema";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".csv"];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting：每分鐘最多 5 次上傳
    const { allowed, retryAfterMs } = checkRateLimit(
      `upload:${userId}`,
      RATE_LIMITS.UPLOAD
    );
    if (!allowed) {
      return NextResponse.json(
        { error: `上傳太頻繁，請 ${Math.ceil(retryAfterMs / 1000)} 秒後再試` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const accountId = formData.get("accountId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 檔案大小限制（10MB）
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // 副檔名白名單（只允許 CSV）
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
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
    // 只記錄 server-side log，不把錯誤細節暴露給客戶端
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
