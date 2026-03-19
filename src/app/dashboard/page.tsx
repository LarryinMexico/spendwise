import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">儀表板</h1>
          <p className="text-muted-foreground">查看你的財務概況</p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            上傳對帳單
          </Button>
        </Link>
      </div>

      <MonthlySummary />
      <RecentTransactions />
    </div>
  );
}
