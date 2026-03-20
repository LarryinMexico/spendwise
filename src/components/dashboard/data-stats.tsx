"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Calendar, Hash, Loader2 } from "lucide-react";

interface DataStats {
  totalTransactions: number;
  monthsCovered: number;
  oldestDate: string | null;
  newestDate: string | null;
}

export function DataStats() {
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/transactions?limit=10000");
        if (!res.ok) throw new Error("Failed to fetch");
        const { transactions } = await res.json();

        if (!transactions || transactions.length === 0) {
          setStats(null);
          return;
        }

        const dates = transactions.map((t: { originalDate: string }) => t.originalDate);
        const sortedDates = dates.sort();
        const months = new Set(sortedDates.map((d: string) => d.slice(0, 7)));

        setStats({
          totalTransactions: transactions.length,
          monthsCovered: months.size,
          oldestDate: sortedDates[0] || null,
          newestDate: sortedDates[sortedDates.length - 1] || null,
        });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>載入資料統計...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">
            尚無資料，上傳 CSV 開始使用
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>共</span>
            <span className="font-medium text-foreground">
              {stats.totalTransactions} 筆
            </span>
            <span>交易</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>跨度</span>
            <span className="font-medium text-foreground">
              {stats.monthsCovered} 個月
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span>{formatDate(stats.oldestDate)}</span>
            <span>~</span>
            <span>{formatDate(stats.newestDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
