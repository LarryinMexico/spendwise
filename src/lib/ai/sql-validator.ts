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

  // Must start with SELECT — reject all write operations
  if (!upperSQL.startsWith("SELECT")) {
    return { valid: false, reason: "Only SELECT queries are allowed" };
  }

  // Check for dangerous SQL injection patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(sql)) {
      return { valid: false, reason: "Detected dangerous SQL pattern" };
    }
  }

  // Table whitelist enforcement
  const tableMatch = upperSQL.match(/FROM\s+(\w+)/i);
  if (tableMatch && !ALLOWED_TABLES.includes(tableMatch[1].toLowerCase())) {
    return { valid: false, reason: `Unauthorized table: ${tableMatch[1]}` };
  }

  // User isolation enforcement — must include clerk_user_id filter
  if (!upperSQL.includes("clerk_user_id") && !upperSQL.includes("clerkUserId")) {
    if (!upperSQL.includes("WHERE")) {
      return { valid: false, reason: "Query must include a WHERE clause" };
    }
    return { valid: false, reason: "Query must include user isolation filter (clerk_user_id)" };
  }

  if (!upperSQL.includes(userId) && !upperSQL.includes("clerkUserId")) {
    return { valid: false, reason: "Query must include user isolation filter (clerk_user_id)" };
  }

  return { valid: true };
}

export function sanitizeSQL(sql: string): string {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*.*?\*\//g, "")
    .trim();
}
