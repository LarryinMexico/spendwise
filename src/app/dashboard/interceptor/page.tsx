"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Lightbulb, Sparkles, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

interface Transaction {
  originalDate: string;
  transactionType: "income" | "expense";
  normalizedAmount?: string;
  originalAmount?: string;
}

export default function InterceptorPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<{
    monthlyIncome: number;
    monthlyExpense: number;
    balance: number;
  } | null>(null);

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        const res = await fetch("/api/transactions?limit=1000");
        if (!res.ok) return;
        const { transactions } = await res.json();

        if (!transactions || transactions.length === 0) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const startOfMonth = `${year}-${pad(month + 1)}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endOfMonth = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

        const monthlyTxs = transactions.filter((t: Transaction) => {
          const date = t.originalDate;
          return date >= startOfMonth && date <= endOfMonth;
        });

        const income = monthlyTxs
          .filter((t: Transaction) => t.transactionType === "income")
          .reduce((sum: number, t: Transaction) => sum + parseFloat(t.normalizedAmount || t.originalAmount || "0"), 0);

        const expense = monthlyTxs
          .filter((t: Transaction) => t.transactionType === "expense")
          .reduce((sum: number, t: Transaction) => sum + Math.abs(parseFloat(t.normalizedAmount || t.originalAmount || "0")), 0);

        setFinancialData({
          monthlyIncome: income,
          monthlyExpense: Math.abs(expense),
          balance: income - Math.abs(expense),
        });
      } catch {
        // ignore
      }
    }

    fetchFinancialData();
  }, []);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/interceptor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) throw new Error("API error");

      const body = res.body;
      if (!body) throw new Error("No response body");
      const reader = body.getReader();

      const decoder = new TextDecoder();
      let buffer = "";

      function processChunk({ done, value }: ReadableStreamReadResult<Uint8Array>) {
        if (done) {
          setIsLoading(false);
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        setResponse(buffer);

        reader.read().then(processChunk);
      }

      reader.read().then(processChunk);
    } catch (e) {
      console.error("Interceptor error:", e);
      setResponse("分析失敗，請稍後再試。");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">消費決策助手</h1>
        <p className="text-muted-foreground">
          輸入你想購買的東西，AI 會根據你的財務狀況提供建議
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                詢問我
              </CardTitle>
              <CardDescription>
                例如：「我想買一台 iPhone 16」或「我想去日本旅遊」
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="我想買..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="resize-none pr-12 min-h-[100px]"
                  rows={4}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 bottom-2 h-8 w-8"
                  onClick={handleSubmit}
                  disabled={isLoading || !question.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {response && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {response}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">本月財務概況</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>收入</span>
                </div>
                <span className="font-medium text-green-600">
                  {financialData ? formatCurrency(financialData.monthlyIncome) : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span>支出</span>
                </div>
                <span className="font-medium text-red-600">
                  {financialData ? formatCurrency(financialData.monthlyExpense) : "-"}
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>餘額</span>
                </div>
                <span className={`font-bold ${financialData && financialData.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {financialData ? formatCurrency(financialData.balance) : "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">常見問題</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "我想買 iPhone 16",
                "我想去日本旅遊",
                "我想買一台摩托車",
                "我想報名補習班",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
