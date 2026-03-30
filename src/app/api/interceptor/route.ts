import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { withUserDb } from "@/lib/db";
import { sql } from "drizzle-orm";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting：每分鐘最多 15 次
    const { allowed, retryAfterMs } = checkRateLimit(
      `interceptor:${userId}`,
      RATE_LIMITS.AI_INTERCEPTOR
    );
    if (!allowed) {
      return NextResponse.json(
        { error: `請求太頻繁，請 ${Math.ceil(retryAfterMs / 1000)} 秒後再試` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const { question } = await request.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    // 限制問題長度，防止 prompt injection 透過超長輸入攻擊
    if (question.trim().length > 500) {
      return NextResponse.json({ error: "Question too long (max 500 chars)" }, { status: 400 });
    }

    // Get real financial data
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let currentBalance = 0;
    let categoryAverages: Record<string, number> = {};

    try {
      await withUserDb(userId, async (tx) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed

        // 使用 Drizzle sql tagged template（parameterized，防 injection）
        const summaryRows = await tx.execute(sql`
          SELECT
            COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN normalized_amount::numeric ELSE 0 END), 0) as income_total,
            COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN normalized_amount::numeric ELSE 0 END), 0) as expense_total
          FROM transactions
          WHERE EXTRACT(YEAR FROM original_date) = ${year}
            AND EXTRACT(MONTH FROM original_date) = ${month}
        `) as unknown as Record<string, unknown>[];

        if (summaryRows.length > 0) {
          monthlyIncome = Number(summaryRows[0].income_total) || 0;
          monthlyExpense = Math.abs(Number(summaryRows[0].expense_total) || 0);
          currentBalance = monthlyIncome - monthlyExpense;
        }

        // 使用 parameterized query 取得 category 統計
        const categoryRows = await tx.execute(sql`
          SELECT
            COALESCE(ai_category, 'Uncategorized') as category,
            AVG(normalized_amount::numeric) as avg_amount,
            COUNT(*) as count
          FROM transactions
          WHERE transaction_type = 'expense'
            AND original_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
          GROUP BY 1
          ORDER BY 2 DESC
          LIMIT 10
        `) as unknown as Record<string, unknown>[];

        categoryAverages = {};
        for (const row of categoryRows) {
          categoryAverages[row.category as string] = Number(row.avg_amount) || 0;
        }
      });
    } catch (e) {
      console.error("Failed to get financial data:", e);
    }

    const prompt = `System Role: You are an elite, highly analytical Chief Financial Officer (CFO) and personal wealth advisor. Your objective is to provide objective, data-driven financial advice to the user based on their strict financial realities.

**Context - User Financial Statement:**
- Monthly Income: $${monthlyIncome.toFixed(2)}
- Monthly Expense: $${monthlyExpense.toFixed(2)}
- Current Net Balance (This Month): $${currentBalance.toFixed(2)}
- Average Category Spend (Last 3 Months):
${Object.entries(categoryAverages).map(([cat, avg]) => `  - ${cat}: $${avg.toFixed(2)}/mo`).join("\n")}

**Task Context:**
The user is contemplating a financial decision or asking a wealth-related question:
"${question}"

**Instruction:**
Analyze the user's inquiry and provide a structured, professional response in English. Follow this exact format:
1. **Financial Impact Assessment**: Quantify how this decision impacts their current net balance and monthly burn rate.
2. **Historical Alignment**: Evaluate if this aligns with their 3-month trailing averages for the respective category.
3. **Strategic Verdict**: Conclude with a clear recommendation: [BUY], [DELAY], or [SKIP].

**Constraints:**
- Maintain a ruthless but constructive professional tone.
- Do not use any emojis.
- Limit the response to 3 concise data-backed paragraphs.
- Never invent numbers; strictly use the provided financial statement.`;

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Interceptor error:", error);
    return NextResponse.json(
      { error: "Analytics failed" },
      { status: 500 }
    );
  }
}
