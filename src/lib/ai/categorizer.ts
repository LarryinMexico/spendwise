import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import type { Transaction } from "@/types/database";

const CATEGORIES = [
  "餐飲",
  "交通",
  "購物",
  "娛樂",
  "醫療",
  "教育",
  "居住",
  "薪資/Income",
  "轉帳",
  "Others",
];

const CATEGORY_PROMPT = CATEGORIES.join("、");

export interface CategorizationResult {
  category: string;
  confidence: number;
  reasoning: string;
}

export async function categorizeTransactions(
  transactions: Pick<Transaction, "id" | "originalDescription">[]
): Promise<Map<string, CategorizationResult>> {
  if (transactions.length === 0) {
    return new Map();
  }

  const descriptions = transactions
    .map((t, i) => `${i + 1}. ${t.originalDescription}`)
    .join("\n");

  const prompt = `System Role: You are an expert forensic accountant and financial classification algorithm.

**Context:**
Your task is to classify raw bank transaction descriptions into standardized financial categories.

**Allowed Categories:** 
${CATEGORY_PROMPT}

**Raw Transactions List:**
${descriptions}

**Instruction:**
Map each transaction to the most accurate category from the Allowed Categories list.
Return the result strictly as a JSON array of objects, preserving the original order.

**Expected JSON Format:**
[
  {"category": "CategoryName", "confidence": 0.95, "reasoning": "Brief rationale in English"}
]

**Constraints:**
- 'confidence' must be a float between 0.0 and 1.0.
- 'category' must strictly match one of the Allowed Categories.
- Output ONLY valid JSON syntax. Do not wrap in markdown tags or include conversational text.`;

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt,
    temperature: 0.1,
  });

  const results = new Map<string, CategorizationResult>();

  try {
    const cleanedText = text.replace(/```json\s*|```\s*/g, '').trim();
    const parsed = JSON.parse(cleanedText) as CategorizationResult[];

    for (let i = 0; i < transactions.length && i < parsed.length; i++) {
       const item = parsed[i];
       if (item && item.category) {
          results.set(transactions[i].id, {
            category: item.category,
            confidence: item.confidence ?? 0.8,
            reasoning: item.reasoning ?? "自動分類",
          });
       }
    }
  } catch (e) {
    console.error("Failed to parse categorization response. Text was:", text, e);
    throw new Error("AI 回應格式Error");
  }

  return results;
}
