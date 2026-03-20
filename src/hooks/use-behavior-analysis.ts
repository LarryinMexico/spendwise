"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "@/hooks/use-transactions";
import {
  analyzeWeeklyPatterns,
  detectAnomalies,
  analyzeTrend,
  analyzeCategorySpending,
  generateInsights,
  type BehaviorInsights,
} from "@/lib/analytics/behavior-analyzer";

export function useBehaviorAnalysis() {
  const [insights, setInsights] = useState<BehaviorInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [textInsights, setTextInsights] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/monthly-trend?months=6");
        if (!res.ok) throw new Error("取得資料失敗");
        const { data: trendData } = await res.json();

        const txRes = await fetch("/api/transactions?limit=1000");
        if (!txRes.ok) throw new Error("取得交易失敗");
        const { transactions } = await txRes.json();

        const weeklyPatterns = analyzeWeeklyPatterns(transactions as Transaction[]);
        const anomalies = detectAnomalies(transactions as Transaction[]);
        const trend = analyzeTrend(trendData);
        const categoryAnalysis = analyzeCategorySpending(transactions as Transaction[]);

        const topSpendDay = weeklyPatterns.length > 0 ? weeklyPatterns[0] : null;

        const insights: BehaviorInsights = {
          weeklyPatterns,
          topSpendDay,
          anomalies,
          trend,
          categoryAnalysis,
        };

        setInsights(insights);
        setTextInsights(generateInsights(insights));
      } catch (e) {
        console.error("Behavior analysis error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { insights, loading, textInsights };
}
