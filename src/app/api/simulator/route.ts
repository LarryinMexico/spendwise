import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
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
      return NextResponse.json({ error: "參數格式不正確" }, { status: 400 });
    }

    const { 
      category = "其他", 
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
      return new Response("請調整左側滑桿模擬看看！", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const prompt = `你是一個個人財務顧問。根據以下真實財務數據提供建議：

**用戶財務概況：**
- 月收入：$${monthlyIncome.toLocaleString()}
- 月總支出：$${totalMonthlyExpense.toLocaleString()}
- 當前餘額：$${currentBalance.toLocaleString()}

**模擬調整：**
- 調整類別：${category}
- 原始月支出：$${currentMonthly.toLocaleString()}
- 調整後月支出：$${adjustedMonthly.toLocaleString()}
- 調整幅度：${adjustment > 0 ? "+" : ""}${adjustment}%
- 月節省：$${monthlySavings.toLocaleString()}
- 年節省：$${annualSavings.toLocaleString()}

請用繁體中文回答，包含：
1. 這個調整對你整體財務的影響
2. 具體的行動建議
3. 這個改變如何幫助你達成財務目標

保持回答簡潔有力，2-3段落為宜。用溫暖但專業的語氣。`;

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
    console.error("Simulator error:", error);
    return NextResponse.json(
      { error: "模擬失敗" },
      { status: 500 }
    );
  }
}
