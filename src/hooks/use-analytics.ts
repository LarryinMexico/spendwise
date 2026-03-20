"use client";

import { useEffect, useState } from "react";

export interface MonthlyTrendData {
  month: string;
  expense: number;
  income: number;
}

export interface CategoryBreakdownData {
  category: string;
  value: number;
}

export function useMonthlyTrend(months = 6) {
  const [data, setData] = useState<MonthlyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics/monthly-trend?months=${months}`);
        if (!res.ok) throw new Error("取得資料失敗");
        const result = await res.json();
        setData(result.data || []);
      } catch (e) {
        console.error("Monthly trend error:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [months]);

  return { data, loading };
}

export function useCategoryBreakdown() {
  const [data, setData] = useState<CategoryBreakdownData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/category-breakdown");
        if (!res.ok) throw new Error("取得資料失敗");
        const result = await res.json();
        setData(result.data || []);
      } catch (e) {
        console.error("Category breakdown error:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading };
}
