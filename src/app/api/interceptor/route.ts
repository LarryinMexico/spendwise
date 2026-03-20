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

    const prompt = `你是個人財務顧問，幫助用戶做出明智的消費決策。

**用戶真實財務資料：**
- 月收入：$${monthlyIncome.toLocaleString()}
- 月支出：$${monthlyExpense.toLocaleString()}
- 本月餘額：$${currentBalance.toLocaleString()}
- 消費類別平均（過去3個月）：
${Object.entries(categoryAverages).map(([cat, avg]) => `  - ${cat}：$${avg.toFixed(0)}/月`).join("\n")}

**用戶問題：**
"${question}"

請用繁體中文回答，分析這個購買決策：
1. 這個消費對你的財務有何影響？
2. 對比其他月份的類別支出，這合理嗎？
3. 建議購買、不購買、還是延後購買？

回答要溫暖但直接，2-3段落。`;

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
