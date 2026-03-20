import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { AICategorizeButton } from "@/components/dashboard/ai-categorize-button";
import { QueryDialog } from "@/components/chat/query-dialog";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">儀表板</h1>
          <p className="text-muted-foreground">查看你的財務概況</p>
        </div>
        <div className="flex items-center gap-2">
          <QueryDialog>
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              AI 查詢
            </Button>
          </QueryDialog>
          <AICategorizeButton />
          <Link href="/dashboard/upload">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              上傳對帳單
            </Button>
          </Link>
        </div>
      </div>

      <MonthlySummary />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <MonthlyBarChart />
        </div>
        <div className="col-span-3">
          <CategoryPieChart />
        </div>
      </div>

      <RecentTransactions />
    </div>
  );
}
