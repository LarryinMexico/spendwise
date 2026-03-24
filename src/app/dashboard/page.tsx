"use client";

import { useDateRange } from "@/hooks/use-date-range";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AICategorizeButton } from "@/components/dashboard/ai-categorize-button";
import { QueryDialog } from "@/components/chat/query-dialog";
import { DataStats } from "@/components/dashboard/data-stats";
import dynamic from "next/dynamic";

const CategoryPieChart = dynamic(
  () => import("@/components/charts/category-pie-chart").then((mod) => mod.CategoryPieChart),
  { ssr: false, loading: () => <div className="h-[350px] w-full rounded-xl bg-muted/40 animate-pulse border border-border" /> }
);
const MonthlyBarChart = dynamic(
  () => import("@/components/charts/monthly-bar-chart").then((mod) => mod.MonthlyBarChart),
  { ssr: false, loading: () => <div className="h-[350px] w-full rounded-xl bg-muted/40 animate-pulse border border-border" /> }
);
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare } from "lucide-react";

export default function DashboardPage() {
  const { date, setDate, preset, setPreset } = useDateRange();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">View your financial overview</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            date={date}
            setDate={setDate}
            preset={preset}
            setPreset={setPreset}
          />
          <AICategorizeButton />
          <Link href="/dashboard/upload">
            <Button className="bg-[#111111] hover:bg-[#222222] text-white shadow-none rounded-md">
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </Link>
        </div>
      </div>

      <DataStats />

      <MonthlySummary dateRange={date || { from: undefined, to: undefined }} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <MonthlyBarChart dateRange={date} />
        </div>
        <div className="col-span-3">
          <CategoryPieChart dateRange={date} />
        </div>
      </div>

      <RecentTransactions />
    </div>
  );
}
