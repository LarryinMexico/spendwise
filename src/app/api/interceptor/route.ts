import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { withUserDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question } = await request.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "問題不能為空" }, { status: 400 });
    }

    // Get real financial data
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let currentBalance = 0;
    let categoryAverages: Record<string, number> = {};

    try {
      // Get summary and category averages using withUserDb
      await withUserDb(userId, async (tx) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const startOfMonth = `${year}-${pad(month + 1)}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endOfMonth = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

        const summaryRows = await tx.execute(sql.raw(`
          SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN normalized_amount::numeric ELSE 0 END), 0) as income_total,
            COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN normalized_amount::numeric ELSE 0 END), 0) as expense_total
          FROM transactions
          WHERE original_date >= '${startOfMonth}'
            AND original_date <= '${endOfMonth}'
        `)) as unknown as Record<string, unknown>[];

        if (summaryRows.length > 0) {
          monthlyIncome = Number(summaryRows[0].income_total) || 0;
          monthlyExpense = Math.abs(Number(summaryRows[0].expense_total) || 0);
          currentBalance = monthlyIncome - monthlyExpense;
        }

        // Get category averages (last 3 months)
        const categoryRows = await tx.execute(sql.raw(`
          SELECT 
            COALESCE(ai_category, '未分類') as category,
            AVG(normalized_amount::numeric) as avg_amount,
            COUNT(*) as count
          FROM transactions
          WHERE transaction_type = 'expense'
            AND original_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
          GROUP BY 1
          ORDER BY 2 DESC
          LIMIT 10
        `)) as unknown as Record<string, unknown>[];

        categoryAverages = {};
        for (const row of categoryRows) {
          categoryAverages[row.category as string] = Number(row.avg_amount) || 0;
        }
      });
    } catch (e) {
      console.error("Failed to get financial data:", e);
    }

    const prompt = `You are an elite financial advisor. Help the user make a smart consumption decision based on their financial data.

**User Financial Statement:**
- Monthly Income: $${monthlyIncome.toFixed(2)}
- Monthly Expense: $${monthlyExpense.toFixed(2)}
- Current Net Balance (This Month): $${currentBalance.toFixed(2)}
- Average Category Spend (Last 3 Months):
${Object.entries(categoryAverages).map(([cat, avg]) => `  - ${cat}: $${avg.toFixed(2)}/mo`).join("\n")}

**User Question:**
"${question}"

Please analyze this purchase in English:
1. Financial Impact: How does this affect their budget?
2. Historical Comparison: Is this spend aligned with historical category averages?
3. Verdict: Recommend Buy, Delay, or Skip.

Keep response professional, concise, and do not use any emojis. 2-3 paragraphs maximum.`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.3,
    });

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Interceptor error:", error);
    return NextResponse.json(
      { error: "分析失敗" },
      { status: 500 }
    );
  }
}
