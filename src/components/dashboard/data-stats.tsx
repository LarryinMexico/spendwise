"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Calendar, Hash, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DataStats {
  totalTransactions: number;
  monthsCovered: number;
  oldestDate: string | null;
  newestDate: string | null;
}

const animationConfig = {
  initial: { opacity: 0, filter: "blur(4px)", y: 5 },
  animate: { opacity: 1, filter: "blur(0px)", y: 0 },
  exit: { opacity: 0, filter: "blur(4px)", y: -5 },
  transition: { duration: 0.2, ease: "easeOut" as const }
};

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

  return (
    <div className="h-[48px] overflow-hidden">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" {...animationConfig}>
            <Card className="bg-muted/30 border-transparent">
              <CardContent className="py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                  <span>Loading statistics...</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : !stats ? (
          <motion.div key="empty" {...animationConfig}>
            <Card className="bg-muted/30 border-transparent">
              <CardContent className="py-3">
                <p className="text-sm text-muted-foreground">No data. Upload CSV to start.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="content" {...animationConfig}>
            <Card className="bg-muted/30 border-transparent shadow-none">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span>Total</span>
                    <span className="font-medium text-foreground">{stats.totalTransactions}</span>
                    <span>Transactions</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Interval</span>
                    <span className="font-medium text-foreground">{stats.monthsCovered} Months</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span className="font-bungee">{formatDate(stats.oldestDate)}</span>
                    <span>~</span>
                    <span className="font-bungee">{formatDate(stats.newestDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
