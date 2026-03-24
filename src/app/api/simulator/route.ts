import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid parameter format" }, { status: 400 });
    }

    const { 
      category = "Others", 
      adjustment = 0, 
      currentMonthly = 0, 
      totalMonthlyExpense = 0, 
      monthlyIncome = 0, 
      currentBalance = 0 
    } = body;

    const adjustedMonthly = currentMonthly * (1 + adjustment / 100);
    const monthlySavings = currentMonthly - adjustedMonthly;
    const annualSavings = monthlySavings * 12;

    if (currentMonthly === 0 && totalMonthlyExpense === 0) {
      return new Response("Adjust the left slider to simulate!", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const prompt = `You are a personal financial advisor. Provide advice based on the following real financial data:

**User Financial Overview:**
- Monthly Income：$${monthlyIncome.toLocaleString()}
- Total Monthly Expense：$${totalMonthlyExpense.toLocaleString()}
- Current Balance：$${currentBalance.toLocaleString()}

**Simulation Adjustment:**
- Category to Adjust：${category}
- Original Monthly Expense：$${currentMonthly.toLocaleString()}
- Adjusted Monthly Expense：$${adjustedMonthly.toLocaleString()}
- Adjustment Margin：${adjustment > 0 ? "+" : ""}${adjustment}%
- Monthly Savings：$${monthlySavings.toLocaleString()}
- Annual Savings：$${annualSavings.toLocaleString()}

Please answer in English, including:
1. Impact of this adjustment on your overall finances
2. Specific actionable advice
3. How this change helps you achieve financial goals

Keep your answer concise, preferably 2-3 paragraphs. Use a warm but professional tone.`;

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Simulator error:", error);
    return NextResponse.json(
      { error: "Simulation failed" },
      { status: 500 }
    );
  }
}
