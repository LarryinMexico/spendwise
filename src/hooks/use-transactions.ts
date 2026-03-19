"use client";

import { useEffect, useState } from "react";

export interface Transaction {
  id: string;
  clerkUserId: string;
  accountId: string | null;
  originalDate: string;
  originalDescription: string;
  originalAmount: string;
  normalizedAmount: string;
  transactionType: "expense" | "income" | "transfer" | null;
  aiCategory: string | null;
  status: string | null;
}

export function useTransactions(limit = 10) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch(`/api/transactions?limit=${limit}`);
        if (!res.ok) throw new Error("取得交易失敗");
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "發生錯誤");
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [limit]);

  return { transactions, loading, error };
}

export function useMonthlySummary() {
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];

        const res = await fetch(
          `/api/transactions?limit=1000&startDate=${startOfMonth}&endDate=${endOfMonth}`
        );
        if (!res.ok) throw new Error("取得摘要失敗");
        const data = await res.json();
        const txs = data.transactions || [];

        const income = txs
          .filter((t: Transaction) => t.transactionType === "income")
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.originalAmount), 0);

        const expense = txs
          .filter((t: Transaction) => t.transactionType === "expense")
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.originalAmount), 0);

        setSummary({
          income,
          expense,
          balance: income - expense,
        });
      } catch (e) {
        console.error("Summary error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  return { summary, loading };
}
