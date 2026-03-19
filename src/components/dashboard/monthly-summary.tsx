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

export function MonthlySummary() {
  const { summary, loading } = useMonthlySummary();

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">本月收入</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.income)}
          </div>
          <p className="text-xs text-muted-foreground">收入總計</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">本月支出</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.expense)}
          </div>
          <p className="text-xs text-muted-foreground">支出總計</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">本月結餘</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              summary.balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(summary.balance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.balance >= 0 ? "本月盈餘" : "本月赤字"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
