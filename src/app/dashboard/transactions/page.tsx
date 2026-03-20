"use client";

import { useTransactions } from "@/hooks/use-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function TransactionsPage() {
  const { transactions, loading } = useTransactions(100);

  const formatAmount = (amount: string, type: string) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return "NT$0";
    return type === "expense" ? `-NT$${value}` : `+NT$${value}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">所有交易歷史</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近 100 筆交易</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              目前沒有任何交易記錄，請先到「上傳對帳單」頁面上傳。
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>說明</TableHead>
                    <TableHead>類別</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.originalDate ? tx.originalDate.substring(0, 10) : "-"}
                      </TableCell>
                      <TableCell>{tx.originalDescription}</TableCell>
                      <TableCell>
                        {tx.aiCategory ? (
                          <Badge variant="secondary">{tx.aiCategory}</Badge>
                        ) : (
                          <Badge variant="outline">未分類</Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        tx.transactionType === "expense" ? "text-destructive" : "text-emerald-600"
                      }`}>
                        {formatAmount(tx.normalizedAmount || tx.originalAmount, tx.transactionType || "expense")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
