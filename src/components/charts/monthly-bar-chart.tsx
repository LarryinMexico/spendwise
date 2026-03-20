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

export function MonthlyBarChart() {
  const { data, loading } = useMonthlyTrend();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>每月支出趨勢</CardTitle>
          <CardDescription>過去 6 個月</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border border-[#E5E5E5] bg-white rounded-md">
      <CardHeader className="border-b border-[#E5E5E5] pb-3">
        <CardTitle className="text-sm font-semibold text-[#111111] tracking-tight">每月支出趨勢</CardTitle>
        <CardDescription className="text-xs text-[#666666]">過去六個月支出對帳狀況</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
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
                formatter={(value: any) => [`$${value.toLocaleString()}`, "支出"]}
              />
              <Bar
                dataKey="expense"
                fill="#111111"
                radius={[4, 4, 0, 0]}
                name="支出"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
