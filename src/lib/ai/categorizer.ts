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

  const prompt = `你是一個消費分類專家。請根據Transactions描述判断类别。

可用类别：${CATEGORY_PROMPT}

以下是待分類的Transactions：
${descriptions}

請為每Transactions回傳 JSON 陣列，格式如下（保持原始順序）：
[
  {"category": "Category名稱", "confidence": 0.95, "reasoning": "分類理由"}
]

注意：
- confidence 為 0 到 1 之間的數字
- category 必須是可用类别中的某一個
- 只回傳 JSON，不要有Others文字`;

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
