"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTransactions } from "@/hooks/use-transactions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function RecentTransactions() {
  const { transactions, loading } = useTransactions(10);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-TW", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近交易</CardTitle>
          <CardDescription>載入中...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近交易</CardTitle>
          <CardDescription>尚無交易記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            請先上傳銀行對帳單來開始追蹤你的財務狀況
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近交易</CardTitle>
        <CardDescription>最新 10 筆交易記錄</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead>類別</TableHead>
              <TableHead className="text-right">金額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">
                  {formatDate(tx.originalDate)}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {tx.originalDescription}
                </TableCell>
                <TableCell>
                  {tx.aiCategory ? (
                    <Badge variant="secondary">{tx.aiCategory}</Badge>
                  ) : (
                    <Badge variant="outline">未分類</Badge>
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    tx.transactionType === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {tx.transactionType === "income" ? "+" : "-"}
                  {formatCurrency(tx.originalAmount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
