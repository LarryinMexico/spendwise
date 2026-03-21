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

function buildUrl(path: string, dateRange?: { from?: Date; to?: Date }) {
  const url = new URL(path, window.location.origin);
  if (dateRange?.from) {
    url.searchParams.append("startDate", dateRange.from.toISOString().split("T")[0]);
  }
  if (dateRange?.to) {
    url.searchParams.append("endDate", dateRange.to.toISOString().split("T")[0]);
  }
  return url.toString();
}

export function useMonthlyTrend(dateRange?: { from?: Date; to?: Date }) {
  const [data, setData] = useState<MonthlyTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!dateRange?.from || !dateRange?.to) {
        setLoading(false);
        setData([]);
        return;
      }
      setLoading(true);
      try {
        const url = buildUrl("/api/analytics/monthly-trend", dateRange);
        const res = await fetch(url);
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
  }, [dateRange]);

  return { data, loading };
}

export function useCategoryBreakdown(dateRange?: { from?: Date; to?: Date }) {
  const [data, setData] = useState<CategoryBreakdownData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!dateRange?.from || !dateRange?.to) {
        setLoading(false);
        setData([]);
        return;
      }
      setLoading(true);
      try {
        const url = buildUrl("/api/analytics/category-breakdown", dateRange);
        const res = await fetch(url);
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
  }, [dateRange]);

  return { data, loading };
}
