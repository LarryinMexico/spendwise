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
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const MotionTableRow = motion.create(TableRow);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // Extremely fast stagger to prevent blocking on mobile
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" as const } },
};

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

  return (
    <Card className="shadow-none border border-[#E5E5E5]">
      <CardHeader className="border-b border-[#E5E5E5] pb-4">
        <CardTitle className="text-sm font-semibold tracking-tight">Recent Transactions</CardTitle>
        <CardDescription className="text-xs">Latest 10 Transactions</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 px-0 sm:px-6"> 
        {/* On mobile (px-0), we extend the list edge-to-edge. On desktop (sm:px-6) we keep normal padding. */}
        <div className="overflow-x-auto relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3"
              >
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Loading transactions...</span>
              </motion.div>
            ) : transactions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center p-6 text-sm text-muted-foreground text-center"
              >
                Upload bank statement to start tracking
              </motion.div>
            ) : (
              <motion.table
                key="table"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="w-full caption-bottom text-sm"
              >
                <TableHeader>
                  <TableRow className="border-b-[#E5E5E5] hover:bg-transparent">
                    <TableHead className="pl-4 sm:pl-2 h-10">Date</TableHead>
                    <TableHead className="h-10">Description</TableHead>
                    <TableHead className="h-10">Category</TableHead>
                    <TableHead className="text-right pr-4 sm:pr-2 h-10">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <MotionTableRow 
                      key={tx.id} 
                      variants={itemVariants}
                      className="border-b border-[#F0F0F0]/50 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium text-xs sm:text-sm pl-4 sm:pl-2 py-4 sm:py-3 whitespace-nowrap">
                        {/* py-4 ensures touching rows is easy on mobile (at least 44px high) */}
                        {formatDate(tx.originalDate)}
                      </TableCell>
                      <TableCell className="max-w-[120px] sm:max-w-xs truncate py-4 sm:py-3">
                        {tx.originalDescription}
                      </TableCell>
                      <TableCell className="py-4 sm:py-3">
                        {tx.aiCategory ? (
                          <Badge variant="secondary" className="font-normal border-transparent bg-[#F5F5F5] text-[#333333]">
                            {tx.aiCategory}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-normal text-[#999999]">
                            Uncategorized
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium pr-4 sm:pr-2 py-4 sm:py-3 ${
                          tx.transactionType === "income"
                            ? "text-[#10b981]"
                            : "text-[#111111]"
                        }`}
                      >
                        <span className="font-bungee tracking-tight">
                          {tx.transactionType === "income" ? "+" : ""}
                          {formatCurrency(tx.originalAmount)}
                        </span>
                      </TableCell>
                    </MotionTableRow>
                  ))}
                </TableBody>
              </motion.table>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
