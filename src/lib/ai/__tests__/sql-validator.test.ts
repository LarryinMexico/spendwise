import { describe, it, expect } from "vitest";
import { validateSQL, sanitizeSQL } from "../sql-validator";

const MOCK_USER_ID = "user_test_abc123";

describe("validateSQL", () => {
  describe("SELECT-only enforcement", () => {
    it("should accept a valid SELECT query", () => {
      const sql = `SELECT * FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      expect(validateSQL(sql, MOCK_USER_ID)).toEqual({ valid: true });
    });

    it("should reject INSERT queries", () => {
      const sql = `INSERT INTO transactions (id) VALUES ('x')`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("SELECT");
    });

    it("should reject UPDATE queries", () => {
      const sql = `UPDATE transactions SET ai_category = 'hacked'`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });

    it("should reject DELETE queries", () => {
      const sql = `DELETE FROM transactions`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });

    it("should reject DROP TABLE attempts", () => {
      const sql = `SELECT 1; DROP TABLE transactions`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });
  });

  describe("forbidden SQL pattern detection", () => {
    it("should block UNION SELECT injection", () => {
      const sql = `SELECT * FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}' UNION SELECT * FROM users`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("dangerous");
    });

    it("should block UNION ALL SELECT", () => {
      const sql = `SELECT 1 FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}' UNION ALL SELECT password FROM users`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });

    it("should block information_schema access", () => {
      const sql = `SELECT * FROM information_schema.tables WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });

    it("should block pg_ system table access", () => {
      const sql = `SELECT * FROM pg_catalog.pg_tables WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });

    it("should block SLEEP-based timing attacks", () => {
      const sql = `SELECT SLEEP(5) FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });

    it("should block BENCHMARK attacks", () => {
      const sql = `SELECT BENCHMARK(1000000, SHA1('test')) FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });

    it("should block INTO OUTFILE", () => {
      const sql = `SELECT * INTO OUTFILE '/tmp/dump.csv' FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
    });
  });

  describe("table whitelisting", () => {
    it("should allow queries on the transactions table", () => {
      const sql = `SELECT COUNT(*) FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      expect(validateSQL(sql, MOCK_USER_ID).valid).toBe(true);
    });

    it("should reject queries on unauthorized tables", () => {
      const sql = `SELECT * FROM users WHERE clerk_user_id = '${MOCK_USER_ID}'`;
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("users");
    });
  });

  describe("user isolation enforcement", () => {
    it("should reject queries without WHERE clause", () => {
      const sql = "SELECT * FROM transactions";
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("WHERE");
    });

    it("should reject queries with WHERE but no clerk_user_id filter", () => {
      const sql = "SELECT * FROM transactions WHERE ai_category = 'food'";
      const result = validateSQL(sql, MOCK_USER_ID);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("clerk_user_id");
    });

    it("should accept queries with clerk_user_id in WHERE", () => {
      const sql = `SELECT * FROM transactions WHERE clerk_user_id = '${MOCK_USER_ID}' AND ai_category = 'food'`;
      expect(validateSQL(sql, MOCK_USER_ID).valid).toBe(true);
    });
  });
});

describe("sanitizeSQL", () => {
  it("should strip single-line SQL comments", () => {
    const sql = "SELECT * FROM transactions -- drop table users";
    expect(sanitizeSQL(sql)).toBe("SELECT * FROM transactions");
  });

  it("should strip multi-line SQL comments", () => {
    const sql = "SELECT * FROM transactions /* malicious payload */";
    expect(sanitizeSQL(sql)).toBe("SELECT * FROM transactions");
  });

  it("should trim whitespace", () => {
    const sql = "  SELECT * FROM transactions  ";
    expect(sanitizeSQL(sql)).toBe("SELECT * FROM transactions");
  });

  it("should handle nested comment patterns", () => {
    const sql = "SELECT /* comment */ * FROM /* another */ transactions";
    expect(sanitizeSQL(sql)).toBe("SELECT  * FROM  transactions");
  });
});
