import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const prompt = `You are an elite financial advisor. Help the user make a smart consumption decision based on their financial data.

**User Financial Statement:**
- Monthly Income: $50000.00
- Monthly Expense: $1200.00
- Current Net Balance (This Month): $48800.00
- Average Category Spend (Last 3 Months):
  - Coffee: $1200.00/mo

**User Question:**
"請問我這個月花多少錢喝咖啡？我現在的結餘還能買一台 $30,000 的電腦嗎？"

Please analyze this purchase in Traditional Chinese:
1. Financial Impact: How does this affect their budget?
2. Historical Comparison: Is this spend aligned with historical category averages?
3. Verdict: Recommend Buy, Delay, or Skip.

Keep response professional, concise, and do not use any emojis. 2-3 paragraphs maximum.`;

async function main() {
  console.log("正在連線至 Groq API 進行真實推理測試...");
  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      temperature: 0.3,
    });
    console.log("\n=== 🤖 LLM 真實推理回答 ===");
    console.log(text);
    console.log("=====================\n");
  } catch (e) {
    console.error("Error calling Groq API:", e);
  }
}
main();
