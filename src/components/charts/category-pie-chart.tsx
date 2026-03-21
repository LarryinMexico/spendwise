"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategoryBreakdown } from "@/hooks/use-analytics";
import { useState, useEffect } from "react";

const COLORS = [
  "#2563eb", // 藍色
  "#10b981", // 翠綠
  "#f59e0b", // 琥珀
  "#ef4444", // 猩紅
  "#8b5cf6", // 紫色
  "#ec4899", // 粉紅
  "#06b6d4", // 青綠
  "#f97316", // 橙色
  "#14b8a6", // 湖水綠
  "#6366f1", // 靛藍
];

export function CategoryPieChart({ dateRange }: { dateRange?: { from?: Date; to?: Date } }) {
  const { data, loading } = useCategoryBreakdown(dateRange);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (loading || !isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>分類佔比</CardTitle>
          <CardDescription>本月各類別支出</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>分類佔比</CardTitle>
          <CardDescription>本月各類別支出</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            暫無資料
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>分類佔比</CardTitle>
        <CardDescription>本月各類別支出</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="category"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm">{value || "類別"}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
