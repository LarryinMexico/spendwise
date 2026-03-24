"use client";

import useSWR from "swr";

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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("API Route Failed");
  }
  return res.json();
};

export function useTransactions(limit = 10) {
  const { data, error, isLoading } = useSWR(
    `/api/transactions?limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false, // Prevent excessive refetching
      dedupingInterval: 10000, // 10 seconds deduping
    }
  );

  return {
    transactions: (data?.transactions as Transaction[]) || [],
    loading: isLoading,
    error: error ? error.message : null,
  };
}

export function useMonthlySummary(dateRange: { from?: Date; to?: Date }) {
  const pad = (n: number) => n.toString().padStart(2, "0");

  let startDate = "";
  let endDate = "";

  if (dateRange.from && dateRange.to) {
    startDate = `${dateRange.from.getFullYear()}-${pad(dateRange.from.getMonth() + 1)}-${pad(dateRange.from.getDate())}`;
    endDate = `${dateRange.to.getFullYear()}-${pad(dateRange.to.getMonth() + 1)}-${pad(dateRange.to.getDate())}`;
  }

  const { data, error, isLoading } = useSWR(
    startDate && endDate
      ? `/api/transactions?limit=1000&startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const txs = (data?.transactions as Transaction[]) || [];

  const income = txs
    .filter((t: Transaction) => t.transactionType === "income")
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.normalizedAmount || t.originalAmount || "0"), 0);

  const expense = txs
    .filter((t: Transaction) => t.transactionType === "expense")
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.normalizedAmount || t.originalAmount || "0"), 0);

  return {
    summary: {
      income,
      expense: Math.abs(expense),
      balance: income - Math.abs(expense),
    },
    loading: isLoading,
    error: error ? error.message : null,
  };
}
