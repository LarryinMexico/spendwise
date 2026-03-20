import type { Transaction } from "@/hooks/use-transactions";

export interface WeeklyPattern {
  dayOfWeek: string;
  dayOfWeekZh: string;
  transactionCount: number;
  totalAmount: number;
  avgAmount: number;
  percentAboveAverage: number;
}

export interface AnomalyResult {
  transactions: Transaction[];
  threshold: number;
  avgAmount: number;
}

export interface TrendResult {
  direction: "increasing" | "decreasing" | "stable";
  percentChange: number;
  months: { month: string; expense: number }[];
}

export interface CategoryAnalysis {
  category: string;
  monthlyAvg: number;
  transactionCount: number;
}

export interface BehaviorInsights {
  weeklyPatterns: WeeklyPattern[];
  topSpendDay: WeeklyPattern | null;
  anomalies: AnomalyResult;
  trend: TrendResult;
  categoryAnalysis: CategoryAnalysis[];
}

export function analyzeWeeklyPatterns(transactions: Transaction[]): WeeklyPattern[] {
  const dayMap: Record<number, { zh: string; patterns: Transaction[] }> = {
    0: { zh: "週日", patterns: [] },
    1: { zh: "週一", patterns: [] },
    2: { zh: "週二", patterns: [] },
    3: { zh: "週三", patterns: [] },
    4: { zh: "週四", patterns: [] },
    5: { zh: "週五", patterns: [] },
    6: { zh: "週六", patterns: [] },
  };

  transactions
    .filter((t) => t.transactionType === "expense")
    .forEach((t) => {
      const date = new Date(t.originalDate);
      const day = date.getDay();
      dayMap[day].patterns.push(t);
    });

  const dailyTotals = Object.values(dayMap).map((d) =>
    d.patterns.reduce((sum, t) => sum + parseFloat(t.originalAmount), 0)
  );
  const avgDaily = dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length || 0;

  const patterns = Object.entries(dayMap).map(([day, data]) => {
    const totalAmount = data.patterns.reduce(
      (sum, t) => sum + parseFloat(t.originalAmount),
      0
    );
    const avgAmount =
      data.patterns.length > 0 ? totalAmount / data.patterns.length : 0;
    const percentAboveAverage = avgDaily > 0 ? ((avgAmount - avgDaily) / avgDaily) * 100 : 0;

    return {
      dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parseInt(day)],
      dayOfWeekZh: data.zh,
      transactionCount: data.patterns.length,
      totalAmount,
      avgAmount,
      percentAboveAverage,
    };
  });

  return patterns.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function detectAnomalies(
  transactions: Transaction[],
  threshold = 2
): AnomalyResult {
  const expenses = transactions.filter((t) => t.transactionType === "expense");
  if (expenses.length === 0) {
    return { transactions: [], threshold, avgAmount: 0 };
  }

  const amounts = expenses.map((t) => parseFloat(t.originalAmount));
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance =
    amounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / amounts.length;
  const std = Math.sqrt(variance);
  const limit = mean + threshold * std;

  const anomalies = expenses.filter(
    (t) => parseFloat(t.originalAmount) > limit
  );

  return { transactions: anomalies, threshold, avgAmount: mean };
}

export function analyzeTrend(
  monthlyData: { month: string; expense: number }[]
): TrendResult {
  if (monthlyData.length < 2) {
    return { direction: "stable", percentChange: 0, months: monthlyData };
  }

  const sorted = [...monthlyData].sort((a, b) => a.month.localeCompare(b.month));
  const first = sorted[0].expense;
  const last = sorted[sorted.length - 1].expense;

  const percentChange = first > 0 ? ((last - first) / first) * 100 : 0;

  let direction: "increasing" | "decreasing" | "stable";
  if (Math.abs(percentChange) < 10) {
    direction = "stable";
  } else if (percentChange > 0) {
    direction = "increasing";
  } else {
    direction = "decreasing";
  }

  return { direction, percentChange, months: sorted };
}

export function analyzeCategorySpending(
  transactions: Transaction[]
): CategoryAnalysis[] {
  const categoryMap: Record<string, { total: number; count: number }> = {};

  transactions
    .filter((t) => t.transactionType === "expense")
    .forEach((t) => {
      const cat = t.aiCategory || "未分類";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, count: 0 };
      }
      categoryMap[cat].total += parseFloat(t.originalAmount);
      categoryMap[cat].count++;
    });

  return Object.entries(categoryMap)
    .map(([category, data]) => ({
      category,
      monthlyAvg: data.total / 3,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.monthlyAvg - a.monthlyAvg);
}

export function generateInsights(data: BehaviorInsights): string[] {
  const insights: string[] = [];

  if (data.topSpendDay && data.topSpendDay.percentAboveAverage > 20) {
    insights.push(
      `你的消費集中在${data.topSpendDay.dayOfWeekZh}，比其他天高 ${Math.round(data.topSpendDay.percentAboveAverage)}%`
    );
  }

  if (data.anomalies.transactions.length > 0) {
    const total = data.anomalies.transactions.reduce(
      (sum, t) => sum + parseFloat(t.originalAmount),
      0
    );
    insights.push(
      `本月有 ${data.anomalies.transactions.length} 筆異常支出，合計 $${Math.round(total).toLocaleString()}`
    );
  }

  const trendMessages = {
    increasing: "過去幾個月支出呈上升趨勢，建議注意控制預算",
    decreasing: "過去幾個月支出有下降趨勢，做得很好！",
    stable: "過去幾個月支出趨於穩定",
  };
  insights.push(trendMessages[data.trend.direction]);

  return insights;
}
