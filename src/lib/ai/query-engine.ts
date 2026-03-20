import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { sqlClient } from "@/lib/db";

export interface QueryResult {
  success: boolean;
  answer: string;
  sql?: string;
  rowCount?: number;
  error?: string;
}

/** Fetch available months so AI has temporal context */
async function getDataContext(userId: string): Promise<string> {
  try {
    const rows = await sqlClient.unsafe(`
      SELECT
        TO_CHAR(original_date, 'YYYY-MM') as month,
        COUNT(*)::int as count,
        COALESCE(SUM(normalized_amount::numeric) FILTER (WHERE transaction_type='expense'), 0)::numeric(12,2) as expense_total,
        COALESCE(SUM(normalized_amount::numeric) FILTER (WHERE transaction_type='income'), 0)::numeric(12,2) as income_total
      FROM transactions
      WHERE clerk_user_id = '${userId}'
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `) as Record<string, unknown>[];

    if (rows.length === 0) {
      return "【資料庫目前沒有任何交易記錄。使用者尚未上傳資料。】";
    }

    const lines = rows.map(
      (r) =>
        `  ${r.month}: ${r.count} 筆，支出合計 NT$${r.expense_total}，收入合計 NT$${r.income_total}`
    );
    return `【使用者實際有資料的月份】\n${lines.join("\n")}`;
  } catch {
    return "【無法取得資料月份資訊】";
  }
}

const SCHEMA = `
表格: transactions（PostgreSQL）
欄位:
- clerk_user_id TEXT  → 使用者 ID，必須過濾
- original_date DATE  → 交易日期 YYYY-MM-DD
- original_description TEXT → 交易說明
- original_amount NUMERIC → 原始金額（支出為正數）
- normalized_amount NUMERIC → 標準化金額（永遠為正數）
- transaction_type TEXT → 'expense'(支出) 或 'income'(收入)
- ai_category TEXT → AI分類（如：餐飲、交通、購物 等）

金額計算規則:
- 支出總額: COALESCE(SUM(normalized_amount::numeric), 0) WHERE transaction_type = 'expense'
- 收入總額: COALESCE(SUM(normalized_amount::numeric), 0) WHERE transaction_type = 'income'

日期範例:
- 本月: original_date >= DATE_TRUNC('month', CURRENT_DATE)
- 上個月: original_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND original_date < DATE_TRUNC('month', CURRENT_DATE)
- 完整一年: original_date >= DATE_TRUNC('year', CURRENT_DATE)
`;

export async function askAI(
  question: string,
  userId: string
): Promise<QueryResult> {
  // Step 1: Gather actual data context so AI knows what months are available
  const dataContext = await getDataContext(userId);

  // If no data at all, return early with helpful message
  if (dataContext.includes("尚未上傳")) {
    return {
      success: true,
      answer: "您的資料庫目前還沒有任何交易記錄。請先到「上傳對帳單」頁面上傳 CSV 檔案，就可以開始查詢了！",
      rowCount: 0,
    };
  }

  // Step 2: Generate SQL with full context
  const sqlGenPrompt = `你是一個 PostgreSQL 查詢專家。

${SCHEMA}

${dataContext}

安全規則: WHERE 條件中必須包含 clerk_user_id = '${userId}'

使用者問題: ${question}

重要: 請根據上方【使用者實際有資料的月份】來決定要查詢哪個時間範圍。
例如使用者問「上個月」但資料只有本月，則查本月並在回覆中說明。

只回傳純 JSON，不要加任何說明文字:
{"sql": "SELECT ..."}`;

  let generatedSQL = "";
  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: sqlGenPrompt,
      temperature: 0.1,
    });

    const jsonMatch = text.match(/\{[\s\S]*?"sql"[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    const parsed = JSON.parse(jsonMatch[0]);
    generatedSQL = (parsed.sql || "").trim();
  } catch (e) {
    console.error("[query-engine] SQL generation failed:", e);
    return {
      success: false,
      answer: "AI 無法理解這個問題，請換個方式描述（例如：「本月餐飲消費」）",
    };
  }

  // Safety checks
  if (!generatedSQL.toUpperCase().trimStart().startsWith("SELECT")) {
    return { success: false, answer: "❌ 安全限制：只允許查詢操作", sql: generatedSQL };
  }
  if (!generatedSQL.includes(userId)) {
    // inject user filter
    if (/WHERE/i.test(generatedSQL)) {
      generatedSQL = generatedSQL.replace(/WHERE/i, `WHERE clerk_user_id = '${userId}' AND `);
    } else {
      generatedSQL += ` WHERE clerk_user_id = '${userId}'`;
    }
  }

  // Step 3: Execute SQL
  let rows: Record<string, unknown>[] = [];
  try {
    const result = await sqlClient.unsafe(generatedSQL);
    rows = Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
  } catch (e) {
    console.error("[query-engine] SQL execution error:", e, "\nSQL:", generatedSQL);
    return {
      success: false,
      answer: "查詢執行失敗，請換個方式問問題",
      sql: generatedSQL,
    };
  }

  // Step 4: Interpret results with data context
  const dataPreview = rows.slice(0, 30);
  const interpretPrompt = `使用者問題: ${question}

${dataContext}

SQL 查詢結果（共 ${rows.length} 筆）:
${JSON.stringify(dataPreview, null, 2)}

請用繁體中文直接回答問題，規則：
- 直接給出關鍵數字（金額、筆數等），不要描述 SQL 過程
- 金額格式: NT$X,XXX（千分位逗號，2位小數如需要）
- 若查詢結果為 0 但資料庫有其他月份的記錄，請說明使用者詢問的月份沒有資料，並提示可以查有資料的月份
- 若 ai_category 顯示為 null，說明記錄尚未被 AI 分類
- 回答簡潔，最多 4 句`;

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: interpretPrompt,
      temperature: 0.3,
    });
    return { success: true, answer: text, sql: generatedSQL, rowCount: rows.length };
  } catch {
    const summary = rows.length > 0
      ? `查詢到 ${rows.length} 筆：\n${JSON.stringify(dataPreview, null, 2)}`
      : "沒有找到符合條件的資料";
    return { success: true, answer: summary, sql: generatedSQL, rowCount: rows.length };
  }
}
