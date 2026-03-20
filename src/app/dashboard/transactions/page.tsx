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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Transactions</h1>
          <p className="text-[#666666] text-sm mt-1">Review and manage billing statements</p>
        </div>
      </div>

      <Card className="border border-[#E5E5E5] shadow-none bg-white rounded-md">
        <CardHeader className="border-b border-[#E5E5E5] pb-4">
          <CardTitle className="text-sm font-semibold text-[#111111]">Recent 100 Transactions</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 px-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-[#999999] py-12 text-sm font-sans border-dashed border-2 border-[#E5E5E5] rounded-md m-4">
              No transactions found. Please import statements first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border-t border-[#E5E5E5]">
                <TableHeader className="bg-[#FAFAFA]">
                  <TableRow className="hover:bg-transparent border-b border-[#E5E5E5]">
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-[#666666]">Date</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-[#666666]">Description</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-[#666666]">Category</TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-semibold text-[#666666]">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#E5E5E5]">
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-[#F7F7F7] border-b border-[#E5E5E5] transition-colors">
                      <TableCell className="px-6 py-4 text-xs text-[#111111]">
                        {tx.originalDate ? tx.originalDate.substring(0, 10) : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-[#111111] font-sans">
                        {tx.originalDescription}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-[#111111]">
                        {tx.aiCategory ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-[#E5E5E5] bg-[#F7F7F7]">
                            {tx.aiCategory}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] text-[#999999] border border-[#E5E5E5] border-dashed">
                            Unclassified
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`px-6 py-4 text-right font-mono text-xs tabular-nums font-medium ${
                        tx.transactionType === "expense" ? "text-rose-600" : "text-emerald-600"
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
