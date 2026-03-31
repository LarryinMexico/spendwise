import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { withUserRawSql } from "@/lib/db";

export interface QueryResult {
  success: boolean;
  answer: string;
  sql?: string;
  rowCount?: number;
  error?: string;
}

/**
 * Forbidden SQL keywords to prevent prompt injection attacks.
 * These operations must never appear in a SELECT query.
 */
const FORBIDDEN_SQL_KEYWORDS = [
  "DROP", "DELETE", "UPDATE", "INSERT", "ALTER",
  "TRUNCATE", "CREATE", "GRANT", "REVOKE", "EXEC",
  "EXECUTE", "COPY", "VACUUM", "REINDEX",
  "--", ";--", "/*", "*/",
];

function isSQLSafe(sql: string): boolean {
  const upper = sql.toUpperCase();
  // Must start with SELECT
  if (!upper.trimStart().startsWith("SELECT")) return false;
  // Must not contain dangerous keywords
  return !FORBIDDEN_SQL_KEYWORDS.some((kw) => upper.includes(kw));
}

/** Fetch available months to provide temporal context to the AI (uses parameterized query) */
async function getDataContext(userId: string): Promise<string> {
  try {
    const rows = await withUserRawSql(
      userId,
      `SELECT
        TO_CHAR(original_date, 'YYYY-MM') as month,
        COUNT(*)::int as count,
        COALESCE(SUM(normalized_amount::numeric) FILTER (WHERE transaction_type='expense'), 0)::numeric(12,2) as expense_total,
        COALESCE(SUM(normalized_amount::numeric) FILTER (WHERE transaction_type='income'), 0)::numeric(12,2) as income_total
      FROM transactions
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12`
      // Note: clerk_user_id filtering is handled automatically by RLS via withUserRawSql
    );

    if (rows.length === 0) {
      return "[NO_DATA: The database has no transaction records. User has not uploaded any data yet.]";
    }

    const lines = rows.map(
      (r) =>
        `  ${r.month}: ${r.count} txns, Expense total NT$${r.expense_total}, Income total NT$${r.income_total}`
    );
    return `[User's available data months]\n${lines.join("\n")}`;
  } catch {
    return "[Unable to retrieve data month information]";
  }
}

const SCHEMA = `
Table: transactions (PostgreSQL)
Columns:
- original_date DATE → Transaction date (YYYY-MM-DD)
- original_description TEXT → Transaction description
- original_amount NUMERIC → Original amount (positive for expenses)
- normalized_amount NUMERIC → Normalized amount (always positive)
- transaction_type TEXT → 'expense' or 'income'
- ai_category TEXT → AI classification (e.g., Dining, Transport, Shopping)

Amount calculation rules:
- Total expenses: COALESCE(SUM(normalized_amount::numeric), 0) WHERE transaction_type = 'expense'
- Total income: COALESCE(SUM(normalized_amount::numeric), 0) WHERE transaction_type = 'income'

Date examples:
- This month: original_date >= DATE_TRUNC('month', CURRENT_DATE)
- Last month: original_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND original_date < DATE_TRUNC('month', CURRENT_DATE)
- Full year: original_date >= DATE_TRUNC('year', CURRENT_DATE)

Security rules:
- Do NOT add clerk_user_id filter (system handles it automatically via RLS — adding it will cause errors)
- Only SELECT queries are allowed
`;

export async function askAI(
  question: string,
  userId: string
): Promise<QueryResult> {
  // Step 1: Get data month context
  const dataContext = await getDataContext(userId);

  if (dataContext.includes("NO_DATA")) {
    return {
      success: true,
      answer: "Your database has no transaction records yet. Please go to the Upload page to import a CSV file, then you can start querying!",
      rowCount: 0,
    };
  }

  // Step 2: AI generates SQL
  const sqlGenPrompt = `You are a PostgreSQL query expert.

${SCHEMA}

${dataContext}

User question: ${question}

Important: Use the [User's available data months] above to determine the correct time range.
For example, if the user asks about "last month" but data only exists for this month, query this month and explain in the response.

Return only pure JSON with no additional text:
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
      answer: "AI could not understand the question. Please try rephrasing (e.g., \"How much did I spend on dining this month?\")",
    };
  }

  // Step 3: Security check (prevent prompt injection)
  if (!isSQLSafe(generatedSQL)) {
    console.warn("[query-engine] Unsafe SQL blocked:", generatedSQL);
    return {
      success: false,
      answer: "Security restriction: Only SELECT queries are allowed",
      sql: generatedSQL,
    };
  }

  // Step 4: Execute SQL (RLS automatically ensures user data isolation)
  let rows: Record<string, unknown>[] = [];
  try {
    const result = await withUserRawSql(userId, generatedSQL);
    rows = Array.isArray(result) ? (result as Record<string, unknown>[]) : [];
  } catch (e) {
    console.error("[query-engine] SQL execution error:", e, "\nSQL:", generatedSQL);
    return {
      success: false,
      answer: "Query execution failed. Please try rephrasing the question.",
      sql: generatedSQL,
    };
  }

  // Step 5: AI interprets results
  const dataPreview = rows.slice(0, 30);
  const interpretPrompt = `User question: ${question}

${dataContext}

SQL query results (${rows.length} total):
${JSON.stringify(dataPreview, null, 2)}

Please answer the question directly in Traditional Chinese. Rules:
- Provide key figures directly (amounts, counts) — do not describe the SQL process
- Amount format: NT$X,XXX (with comma separators, 2 decimal places if needed)
- If the query result is 0 but there are records for other months, inform the user that the requested month has no data and suggest months with available data
- If ai_category is null, note that the record has not been AI-categorized yet
- Keep it concise — maximum 4 sentences`;

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: interpretPrompt,
      temperature: 0.3,
    });
    return { success: true, answer: text, sql: generatedSQL, rowCount: rows.length };
  } catch {
    const summary = rows.length > 0
      ? `Found ${rows.length} results:\n${JSON.stringify(dataPreview, null, 2)}`
      : "No matching records found";
    return { success: true, answer: summary, sql: generatedSQL, rowCount: rows.length };
  }
}
