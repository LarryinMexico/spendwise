"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMonthlySummary } from "@/hooks/use-transactions";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export function MonthlySummary({
  dateRange,
}: {
  dateRange: { from?: Date; to?: Date };
}) {
  const { summary, loading } = useMonthlySummary(dateRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="shadow-none border border-[#E5E5E5] bg-[#FAFAFA] rounded-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#E5E5E5]">
          <CardTitle className="text-xs font-semibold tracking-tight text-[#666666]">Period Income</CardTitle>
          <TrendingUp className="h-3.5 w-3.5 text-[#111111]" />
        </CardHeader>
        <CardContent className="flex flex-col items-end pt-4">
          <div className="font-bungee text-2xl text-[#111111] tabular-nums">
            {formatCurrency(summary.income)}
          </div>
          <p className="text-xs text-[#999999] mt-1">Total Income</p>
        </CardContent>
      </Card>

      <Card className="shadow-none border border-[#E5E5E5] bg-[#FAFAFA] rounded-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#E5E5E5]">
          <CardTitle className="text-xs font-semibold tracking-tight text-[#666666]">Period Expense</CardTitle>
          <TrendingDown className="h-3.5 w-3.5 text-[#111111]" />
        </CardHeader>
        <CardContent className="flex flex-col items-end pt-4">
          <div className="font-bungee text-2xl text-[#111111] tabular-nums">
            {formatCurrency(summary.expense)}
          </div>
          <p className="text-xs text-[#999999] mt-1">Total Expense</p>
        </CardContent>
      </Card>

      <Card className="shadow-none border border-[#E5E5E5] bg-[#FAFAFA] rounded-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#E5E5E5]">
          <CardTitle className="text-xs font-semibold tracking-tight text-[#666666]">Period Balance</CardTitle>
          <Wallet className="h-3.5 w-3.5 text-[#111111]" />
        </CardHeader>
        <CardContent className="flex flex-col items-end pt-4">
          <div className="font-bungee text-2xl text-[#111111] tabular-nums">
            {formatCurrency(summary.balance)}
          </div>
          <p className="text-xs text-[#999999] mt-1">Net Surplus / Deficit</p>
        </CardContent>
      </Card>
    </div>
  );
}
