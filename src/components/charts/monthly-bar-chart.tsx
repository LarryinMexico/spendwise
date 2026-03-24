"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMonthlyTrend } from "@/hooks/use-analytics";
import { useState, useEffect } from "react";

export function MonthlyBarChart({ dateRange }: { dateRange?: { from?: Date; to?: Date } }) {
  const { data, loading } = useMonthlyTrend(dateRange);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Trend</CardTitle>
          <CardDescription>Last 6 Months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="shadow-none border border-[#E5E5E5] bg-white rounded-md">
        <CardHeader className="border-b border-[#E5E5E5] pb-3">
          <CardTitle className="text-sm font-semibold text-[#111111] tracking-tight">Monthly Expense Trend</CardTitle>
          <CardDescription className="text-xs text-[#666666]">Last 6 Months Expense Overview</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border border-[#E5E5E5] bg-white rounded-md">
      <CardHeader className="border-b border-[#E5E5E5] pb-3">
        <CardTitle className="text-sm font-semibold text-[#111111] tracking-tight">Monthly Expense Trend</CardTitle>
        <CardDescription className="text-xs text-[#666666]">Last 6 Months Expense Overview</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={0}>
            <BarChart data={data} margin={{ top: 15, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#666666" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#666666" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                cursor={{ fill: "#F7F7F7", radius: 4 }}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E5",
                  borderRadius: "4px",
                  padding: "6px 10px",
                }}
                labelStyle={{ fontSize: "11px", fontWeight: 600, color: "#111111" }}
                itemStyle={{ fontSize: "11px", color: "#666666" }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, "Expense"]}
              />
              <Bar
                dataKey="expense"
                fill="#111111"
                radius={[4, 4, 0, 0]}
                name="Expense"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
