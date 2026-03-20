"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategorySelector } from "./category-selector";
import { AdjustmentSlider } from "./adjustment-slider";
import { ProjectionChart } from "./projection-chart";
import { SimulationResult } from "./simulation-result";

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
  const [categories, setCategories] = useState<CategorySpending[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [adjustment, setAdjustment] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Financial summary state
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/transactions?limit=1000");
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const { transactions } = await res.json();

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const startOfMonth = `${year}-${pad(month + 1)}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endOfMonth = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

        const summaryRes = await fetch(
          `/api/transactions?limit=1000&startDate=${startOfMonth}&endDate=${endOfMonth}`
        );
        if (summaryRes.ok) {
          const { transactions: monthlyTxs } = await summaryRes.json();
          // Support both snake_case (direct DB) and camelCase types
          const income = monthlyTxs
            .filter((t: any) => (t.transaction_type || t.transactionType) === "income")
            .reduce((sum: number, t: any) => sum + parseFloat(t.normalized_amount || t.normalizedAmount || t.original_amount || t.originalAmount || "0"), 0);
          const expense = monthlyTxs
            .filter((t: any) => (t.transaction_type || t.transactionType) === "expense")
            .reduce((sum: number, t: any) => sum + parseFloat(t.normalized_amount || t.normalizedAmount || t.original_amount || t.originalAmount || "0"), 0);
          
          setMonthlyIncome(income);
          setMonthlyExpense(Math.abs(expense));
          setCurrentBalance(income - Math.abs(expense));
        }

        // Calculate category spending
        const categoryMap: Record<string, number> = {};
        transactions
          .filter((t: any) => (t.transaction_type || t.transactionType) === "expense")
          .forEach((t: any) => {
            const cat = t.ai_category || t.aiCategory || "未分類";
            const amt = parseFloat(t.normalized_amount || t.normalizedAmount || t.original_amount || t.originalAmount || "0");
            categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(amt);
          });

        const categoryList: CategorySpending[] = Object.entries(categoryMap)
          .map(([category, total]) => ({ category, monthlyTotal: total / 3 })) // 假設 3 個月均值
          .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

        setCategories(categoryList);
        if (categoryList.length > 0) {
          setSelectedCategory(categoryList[0].category);
        }
      } catch (e) {
        console.error("Failed to fetch data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate projections
  const projections = useCallback((): ProjectionData[] => {
    const selected = categories.find((c) => c.category === selectedCategory);
    if (!selected) return [];

    const months = ["1月", "3月", "6月", "9月", "12月"];
    const monthValues = [1, 3, 6, 9, 12];
    const baseSpending = selected.monthlyTotal;
    const adjustedSpending = baseSpending * (1 + adjustment / 100);

    return months.map((month, i) => ({
      month,
      current: baseSpending * monthValues[i],
      adjusted: adjustedSpending * monthValues[i],
    }));
  }, [categories, selectedCategory, adjustment]);

  const selectedData = categories.find((c) => c.category === selectedCategory);
  const adjustedMonthly = selectedData
    ? selectedData.monthlyTotal * (1 + adjustment / 100)
    : 0;
  const monthlySavings = selectedData
    ? selectedData.monthlyTotal - adjustedMonthly
    : 0;

  useEffect(() => {
    if (!selectedData || adjustment === 0) {
      setExplanation("");
      return;
    }

    setIsStreaming(true);
    setExplanation("");

    const controller = new AbortController();

    fetch("/api/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: selectedCategory,
        adjustment,
        currentMonthly: selectedData.monthlyTotal,
        totalMonthlyExpense: monthlyExpense,
        monthlyIncome,
        currentBalance,
      }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        const body = res.body;
        if (!body) throw new Error("No response body");
        const reader = body.getReader();

        const decoder = new TextDecoder();
        let buffer = "";

        function processChunk({ done, value }: ReadableStreamReadResult<Uint8Array>) {
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          setExplanation((prev) => prev + buffer);
          buffer = "";
          reader.read().then(processChunk);
        }

        reader.read().then(processChunk);
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error("Streaming error:", e);
      })
      .finally(() => {
        setIsStreaming(false);
      });

    return () => controller.abort();
  }, [selectedCategory, adjustment, selectedData, monthlyExpense, monthlyIncome, currentBalance]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>消費模擬器</CardTitle>
          <CardDescription>調整類別支出，預覽未來影響</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground">尚無消費資料</p>
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
                    <span>原始月支出</span>
                    <span className="font-medium">${Math.round(selectedData.monthlyTotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>調整後月支出</span>
                    <span className="font-medium">${Math.round(adjustedMonthly).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm font-bold">
                    <span>月節省</span>
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
