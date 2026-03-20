import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { BehaviorInsights } from "@/components/analytics/behavior-insights";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">消費分析</h1>
        <p className="text-muted-foreground">視覺化你的消費行為</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MonthlyBarChart />
        <CategoryPieChart />
      </div>

      <BehaviorInsights />
    </div>
  );
}
