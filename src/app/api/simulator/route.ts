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

    const prompt = `System Role: You are a strategic Wealth Management Advisor analyzing financial "what-if" scenarios.

**Context - User Financial Overview:**
- Monthly Income: $${monthlyIncome.toLocaleString()}
- Total Monthly Expense: $${totalMonthlyExpense.toLocaleString()}
- Current Balance: $${currentBalance.toLocaleString()}

**Context - Simulation Parameters:**
- Target Category: ${category}
- Original Monthly Expense: $${currentMonthly.toLocaleString()}
- Adjusted Monthly Expense: $${adjustedMonthly.toLocaleString()}
- Adjustment Margin: ${adjustment > 0 ? "+" : ""}${adjustment}%
- Projected Monthly Delta (Savings): $${monthlySavings.toLocaleString()}
- Projected Annual Delta (Savings): $${annualSavings.toLocaleString()}

**Instruction:**
Evaluate the simulated adjustment and provide a strategic analysis in English. Structure your response as follows:
1. **Macro Impact**: How does this specific adjustment (e.g., ${adjustment}% in ${category}) shift the user's overall financial trajectory?
2. **Execution Strategy**: Provide 1-2 practical, actionable steps to realize this theoretical adjustment in daily life.
3. **Compounding Effect**: Briefly explain how the Annual Delta ($${annualSavings.toLocaleString()}) could be strategically deployed (e.g., index funds, debt reduction) to accelerate wealth building.

**Constraints:**
- Maintain an encouraging yet highly analytical tone.
- Do not use emojis.
- Limit the response to exactly 3 paragraphs.
- Rely solely on the provided projected figures.`;

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
