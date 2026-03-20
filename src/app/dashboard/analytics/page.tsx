import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart } from "lucide-react";

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

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <div>
            <CardTitle>分析洞察</CardTitle>
            <CardDescription>AI 自動產生的消費洞察</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">即將推出</p>
              <p className="text-sm text-muted-foreground">
                異常消費偵測、週期性支出分析、預算建議等功能
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
