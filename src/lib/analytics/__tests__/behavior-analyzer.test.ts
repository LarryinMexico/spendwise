import { describe, it, expect } from "vitest";
import {
  analyzeWeeklyPatterns,
  detectAnomalies,
  analyzeTrend,
  analyzeCategorySpending,
  generateInsights,
} from "../behavior-analyzer";

// Factory helper to create mock transactions
function mockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    clerkUserId: "user_1",
    accountId: null,
    uploadId: null,
    originalDate: "2025-12-01",
    originalDescription: "Test",
    originalAmount: "100.00",
    normalizedAmount: "100.00",
    transactionType: "expense" as const,
    aiCategory: null,
    aiCategoryConfidence: null,
    aiSubcategory: null,
    originalCategory: null,
    rawCsvData: null,
    isRecurring: false,
    isAnomaly: false,
    anomalyScore: null,
    status: "pending" as const,
    autoClassifiedAt: null,
    createdAt: "2025-12-01T00:00:00Z",
    updatedAt: "2025-12-01T00:00:00Z",
    ...overrides,
  };
}

describe("analyzeWeeklyPatterns", () => {
  it("should return patterns for all 7 days", () => {
    const txs = [mockTransaction({ originalDate: "2025-12-01" })]; // Monday
    const result = analyzeWeeklyPatterns(txs);
    expect(result).toHaveLength(7);
  });

  it("should group transactions by day of week", () => {
    const txs = [
      mockTransaction({ originalDate: "2025-12-01", originalAmount: "50" }), // Monday
      mockTransaction({ originalDate: "2025-12-08", originalAmount: "30" }), // Monday
    ];
    const result = analyzeWeeklyPatterns(txs);
    const monday = result.find((r) => r.dayOfWeek === "Mon");
    expect(monday?.transactionCount).toBe(2);
    expect(monday?.totalAmount).toBe(80);
  });

  it("should filter out income transactions", () => {
    const txs = [
      mockTransaction({ originalDate: "2025-12-01", transactionType: "income" }),
    ];
    const result = analyzeWeeklyPatterns(txs);
    const allCounts = result.reduce((sum, r) => sum + r.transactionCount, 0);
    expect(allCounts).toBe(0);
  });

  it("should sort by totalAmount descending", () => {
    const txs = [
      mockTransaction({ originalDate: "2025-12-01", originalAmount: "10" }), // Mon
      mockTransaction({ originalDate: "2025-12-02", originalAmount: "500" }), // Tue
    ];
    const result = analyzeWeeklyPatterns(txs);
    expect(result[0].dayOfWeek).toBe("Tue");
  });
});

describe("detectAnomalies", () => {
  it("should return empty for no transactions", () => {
    const result = detectAnomalies([]);
    expect(result.transactions).toEqual([]);
    expect(result.avgAmount).toBe(0);
  });

  it("should detect transactions above 2 standard deviations", () => {
    const txs = [
      mockTransaction({ originalAmount: "10" }),
      mockTransaction({ originalAmount: "12" }),
      mockTransaction({ originalAmount: "11" }),
      mockTransaction({ originalAmount: "10" }),
      mockTransaction({ originalAmount: "11" }),
      mockTransaction({ originalAmount: "10" }),
      mockTransaction({ originalAmount: "500" }), // extreme outlier
    ];
    const result = detectAnomalies(txs);
    expect(result.transactions.length).toBe(1);
    expect(result.transactions[0].originalAmount).toBe("500");
  });

  it("should ignore income transactions", () => {
    const txs = [
      mockTransaction({ originalAmount: "1000", transactionType: "income" }),
    ];
    const result = detectAnomalies(txs);
    expect(result.transactions).toEqual([]);
  });

  it("should respect custom threshold", () => {
    const txs = [
      mockTransaction({ originalAmount: "10" }),
      mockTransaction({ originalAmount: "10" }),
      mockTransaction({ originalAmount: "30" }),
    ];
    // With threshold=1, the outlier should be detected
    const strict = detectAnomalies(txs, 1);
    expect(strict.transactions.length).toBeGreaterThanOrEqual(1);
  });
});

describe("analyzeTrend", () => {
  it("should return stable for less than 2 months", () => {
    const result = analyzeTrend([{ month: "2025-12", expense: 1000 }]);
    expect(result.direction).toBe("stable");
  });

  it("should detect increasing trend", () => {
    const result = analyzeTrend([
      { month: "2025-10", expense: 100 },
      { month: "2025-11", expense: 150 },
      { month: "2025-12", expense: 200 },
    ]);
    expect(result.direction).toBe("increasing");
    expect(result.percentChange).toBeGreaterThan(0);
  });

  it("should detect decreasing trend", () => {
    const result = analyzeTrend([
      { month: "2025-10", expense: 200 },
      { month: "2025-12", expense: 50 },
    ]);
    expect(result.direction).toBe("decreasing");
    expect(result.percentChange).toBeLessThan(0);
  });

  it("should detect stable when change is under 10%", () => {
    const result = analyzeTrend([
      { month: "2025-10", expense: 100 },
      { month: "2025-12", expense: 105 },
    ]);
    expect(result.direction).toBe("stable");
  });

  it("should sort months chronologically", () => {
    const result = analyzeTrend([
      { month: "2025-12", expense: 300 },
      { month: "2025-10", expense: 100 },
    ]);
    expect(result.months[0].month).toBe("2025-10");
    expect(result.months[1].month).toBe("2025-12");
  });
});

describe("analyzeCategorySpending", () => {
  it("should group by ai_category", () => {
    const txs = [
      mockTransaction({ aiCategory: "Dining", originalAmount: "50" }),
      mockTransaction({ aiCategory: "Dining", originalAmount: "30" }),
      mockTransaction({ aiCategory: "Transport", originalAmount: "20" }),
    ];
    const result = analyzeCategorySpending(txs);
    expect(result).toHaveLength(2);
    const dining = result.find((r) => r.category === "Dining");
    expect(dining?.transactionCount).toBe(2);
  });

  it("should label null categories as Uncategorized", () => {
    const txs = [mockTransaction({ aiCategory: null })];
    const result = analyzeCategorySpending(txs);
    expect(result[0].category).toBe("Uncategorized");
  });

  it("should sort by monthlyAvg descending", () => {
    const txs = [
      mockTransaction({ aiCategory: "Small", originalAmount: "10" }),
      mockTransaction({ aiCategory: "Big", originalAmount: "500" }),
    ];
    const result = analyzeCategorySpending(txs);
    expect(result[0].category).toBe("Big");
  });
});

describe("generateInsights", () => {
  it("should generate trend insight", () => {
    const data = {
      weeklyPatterns: [],
      topSpendDay: null,
      anomalies: { transactions: [], threshold: 2, avgAmount: 0 },
      trend: { direction: "increasing" as const, percentChange: 20, months: [] },
      categoryAnalysis: [],
    };
    const insights = generateInsights(data);
    expect(insights.some((i) => i.includes("Upward"))).toBe(true);
  });

  it("should flag anomaly transactions", () => {
    const data = {
      weeklyPatterns: [],
      topSpendDay: null,
      anomalies: {
        transactions: [mockTransaction({ originalAmount: "999" })],
        threshold: 2,
        avgAmount: 50,
      },
      trend: { direction: "stable" as const, percentChange: 0, months: [] },
      categoryAnalysis: [],
    };
    const insights = generateInsights(data);
    expect(insights.some((i) => i.includes("abnormal"))).toBe(true);
  });
});
