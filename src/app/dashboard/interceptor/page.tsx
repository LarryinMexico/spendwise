"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Lightbulb, Sparkles, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { useMonthlySummary } from "@/hooks/use-transactions";
import { useAIStream } from "@/hooks/use-ai-stream";

export default function InterceptorPage() {
  const [question, setQuestion] = useState("");

  const currentMonthRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: start, to: end };
  }, []);

  const { summary, loading: summaryLoading } = useMonthlySummary(currentMonthRange);
  const { response, isStreaming, streamRequest } = useAIStream("/api/interceptor");

  const handleSubmit = async () => {
    if (!question.trim() || isStreaming) return;
    streamRequest({ question: question.trim() });
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
        <h1 className="text-3xl font-bold tracking-tight">Decision Maker</h1>
        <p className="text-muted-foreground">
          Type what you want to buy, AI will advise based on your finances
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Ask Me
              </CardTitle>
              <CardDescription>
                e.g., 'I want to buy an iPhone 16' or 'Trip to Japan'
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="I want to buy..."
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
                  disabled={isStreaming || !question.trim()}
                >
                  {isStreaming ? (
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
              <CardTitle className="text-base">Monthly Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>Income</span>
                </div>
                <span className="font-medium text-green-600">
                  {summaryLoading ? "-" : formatCurrency(summary.income)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span>Expense</span>
                </div>
                <span className="font-medium text-red-600">
                  {summaryLoading ? "-" : formatCurrency(summary.expense)}
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Balance</span>
                </div>
                <span className={`font-bold ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {summaryLoading ? "-" : formatCurrency(summary.balance)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "I want to buy an iPhone 16",
                "I want to go to Japan",
                "I want to buy a motorcycle",
                "I want to join a course",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuestion(q);
                    streamRequest({ question: q });
                  }}
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
