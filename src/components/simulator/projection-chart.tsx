"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useState, useEffect } from "react";

interface ProjectionData {
  month: string;
  current: number;
  adjusted: number;
}

interface ProjectionChartProps {
  data: ProjectionData[];
  category: string;
}

export function ProjectionChart({ data, category }: ProjectionChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !data || data.length === 0) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>支出預測</CardTitle>
          <CardDescription>
            選擇類別並調整支出以查看預測
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          尚無可用數據
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>支出預測：{category}</CardTitle>
        <CardDescription>
          估計未來 12 個月的累積支出
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full" style={{ minWidth: "100px" }}>
          <ResponsiveContainer width="100%" height={300} minHeight={0}>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 18,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="current"
                name="目前趨勢"
                stroke="#64748b"
                strokeWidth={3}
                dot={{ r: 4, stroke: "#64748b", fill: "#fff" }}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="adjusted"
                name="調整後趨勢"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 5, stroke: "#f59e0b", fill: "#fff" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
