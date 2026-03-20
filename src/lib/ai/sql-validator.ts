const ALLOWED_TABLES = ["transactions"];
const FORBIDDEN_PATTERNS = [
  /;\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)/i,
  /UNION\s+(ALL\s+)?SELECT/i,
  /INTO\s+(OUTFILE|DUMPFILE)/i,
  /LOAD_FILE/i,
  /BENCHMARK/i,
  /SLEEP\s*\(/i,
  /pg_/i,
  /information_schema/i,
  /EXEC\s*\(/i,
  /XP_/i,
];

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateSQL(sql: string, userId: string): ValidationResult {
  const upperSQL = sql.trim();

  if (!upperSQL.startsWith("SELECT")) {
    return { valid: false, reason: "只允許 SELECT 查詢" };
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(sql)) {
      return { valid: false, reason: "檢測到危險 SQL 模式" };
    }
  }

  const tableMatch = upperSQL.match(/FROM\s+(\w+)/i);
  if (tableMatch && !ALLOWED_TABLES.includes(tableMatch[1].toLowerCase())) {
    return { valid: false, reason: `不允許查詢表格: ${tableMatch[1]}` };
  }

  if (!upperSQL.includes("clerk_user_id") && !upperSQL.includes("clerkUserId")) {
    if (!upperSQL.includes("WHERE")) {
      return { valid: false, reason: "必須包含 WHERE 條件" };
    }
    return { valid: false, reason: "必須包含 user 隔離條件 (clerk_user_id)" };
  }

  if (!upperSQL.includes(userId) && !upperSQL.includes("clerkUserId")) {
    return { valid: false, reason: "必須包含 user 隔離條件 (clerk_user_id)" };
  }

  return { valid: true };
}

export function sanitizeSQL(sql: string): string {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*.*?\*\//g, "")
    .trim();
}
