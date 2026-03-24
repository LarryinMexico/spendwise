import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { BehaviorInsights } from "@/components/analytics/behavior-insights";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Spending Analytics</h1>
        <p className="text-muted-foreground">Visualize your spending behavior</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MonthlyBarChart />
        <CategoryPieChart />
      </div>

      <BehaviorInsights />
    </div>
  );
}
