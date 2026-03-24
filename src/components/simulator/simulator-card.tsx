"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategorySelector } from "./category-selector";
import { AdjustmentSlider } from "./adjustment-slider";
import { ProjectionChart } from "./projection-chart";
import { SimulationResult } from "./simulation-result";
import { useTransactions, useMonthlySummary } from "@/hooks/use-transactions";
import { useAIStream } from "@/hooks/use-ai-stream";

interface CategorySpending {
  category: string;
  monthlyTotal: number;
}

interface ProjectionData {
  month: string;
  current: number;
  adjusted: number;
}

export function SimulatorCard() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [adjustment, setAdjustment] = useState<number>(0);

  // 1. Data Flow: Fetch transactions via SWR (deduped automatically globally)
  const { transactions, loading } = useTransactions(1000);
  
  // Calculate this month's start/end correctly via local timezone
  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: start, to: end };
  }, []);

  const { summary } = useMonthlySummary(currentMonthRange);
  const { income: monthlyIncome, expense: monthlyExpense, balance: currentBalance } = summary;

  // 2. Performance Baseline: useMemo for intensive data transformation
  const categories = useMemo(() => {
    if (!transactions) return [];
    
    const categoryMap: Record<string, number> = {};
    transactions
      .filter((t) => t.transactionType === "expense")
      .forEach((t) => {
        const cat = t.aiCategory || "Uncategorized";
        const amt = parseFloat(t.normalizedAmount || t.originalAmount || "0");
        categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(amt);
      });

    const categoryList: CategorySpending[] = Object.entries(categoryMap)
      .map(([category, total]) => ({ category, monthlyTotal: total / 3 })) // Assuming 3 Months Average
      .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

    return categoryList;
  }, [transactions]);

  // Set initial category when loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].category);
    }
  }, [categories, selectedCategory]);

  const selectedData = categories.find((c) => c.category === selectedCategory);
  
  const adjustedMonthly = useMemo(() => {
    return selectedData ? selectedData.monthlyTotal * (1 + adjustment / 100) : 0;
  }, [selectedData, adjustment]);

  const monthlySavings = useMemo(() => {
    return selectedData ? selectedData.monthlyTotal - adjustedMonthly : 0;
  }, [selectedData, adjustedMonthly]);

  // Calculate projections
  const projections = useCallback((): ProjectionData[] => {
    if (!selectedData) return [];

    const months = ["Jan", "Mar", "Jun", "Sep", "Dec"];
    const monthValues = [1, 3, 6, 9, 12];
    const baseSpending = selectedData.monthlyTotal;
    const adjustedSpending = adjustedMonthly;

    return months.map((month, i) => ({
      month,
      current: baseSpending * monthValues[i],
      adjusted: adjustedSpending * monthValues[i],
    }));
  }, [selectedData, adjustedMonthly]);

  // 4. Extensibility: Extracted AI Stream Hook
  const { response: explanation, isStreaming, streamRequest, abortStream } = useAIStream("/api/simulator");

  // Fire AI generation when adjustment stops (debounced conceptually by the user slider release, but triggered by effect)
  useEffect(() => {
    if (!selectedData || adjustment === 0) {
      abortStream();
      return;
    }

    streamRequest({
      category: selectedCategory,
      adjustment,
      currentMonthly: selectedData.monthlyTotal,
      totalMonthlyExpense: monthlyExpense,
      monthlyIncome,
      currentBalance,
    });

    return () => abortStream();
  }, [selectedCategory, adjustment, selectedData, monthlyExpense, monthlyIncome, currentBalance, streamRequest, abortStream]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Spending Simulator</CardTitle>
          <CardDescription>Adjust category expense and preview long-term impact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground">No spending data</p>
          ) : (
            <>
              <CategorySelector
                categories={categories.map((c) => c.category)}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              <AdjustmentSlider value={adjustment} onChange={setAdjustment} />
              {selectedData && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Original Monthly Expense</span>
                    <span className="font-medium">${Math.round(selectedData.monthlyTotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Adjusted Monthly Expense</span>
                    <span className="font-medium">${Math.round(adjustedMonthly).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span>Monthly Savings</span>
                    <span className={monthlySavings >= 0 ? "text-green-500" : "text-red-500"}>
                      ${Math.round(monthlySavings).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <SimulationResult
        explanation={explanation}
        isLoading={isStreaming}
        savings12Months={monthlySavings * 12}
      />

      <ProjectionChart
        data={projections()}
        category={selectedCategory}
      />
    </div>
  );
}
