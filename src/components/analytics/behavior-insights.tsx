"use client";

import { useBehaviorAnalysis } from "@/hooks/use-behavior-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { WeeklyPattern } from "@/lib/analytics/behavior-analyzer";

function WeeklyPatternCard({ pattern }: { pattern: WeeklyPattern }) {
  const isHigh = pattern.percentAboveAverage > 20;
  const isLow = pattern.percentAboveAverage < -20;

  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center gap-2">
        {isHigh ? (
          <TrendingUp className="h-4 w-4 text-orange-500" />
        ) : isLow ? (
          <TrendingDown className="h-4 w-4 text-green-500" />
        ) : null}
        <span className="font-medium">{pattern.dayOfWeekZh}</span>
      </div>
      <div className="text-right">
        <div className="font-bold">
          ${Math.round(pattern.totalAmount).toLocaleString()}
        </div>
        {isHigh && (
          <div className="text-xs text-orange-500">
            +{Math.round(pattern.percentAboveAverage)}%
          </div>
        )}
        {isLow && (
          <div className="text-xs text-green-500">
            {Math.round(pattern.percentAboveAverage)}%
          </div>
        )}
      </div>
    </div>
  );
}

export function BehaviorInsights() {
  const { insights, loading, textInsights } = useBehaviorAnalysis();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Behavior Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Behavior Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Not enough data for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Behavior Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {textInsights.length > 0 && (
          <div className="space-y-2">
            {textInsights.map((insight, i) => (
              <p key={i} className="text-sm">
                • {insight}
              </p>
            ))}
          </div>
        )}

        {insights.weeklyPatterns.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm">Weekly Spending Pattern</h4>
            <div className="space-y-2">
              {insights.weeklyPatterns.slice(0, 3).map((pattern) => (
                <WeeklyPatternCard key={pattern.dayOfWeek} pattern={pattern} />
              ))}
            </div>
          </div>
        )}

        {insights.anomalies.transactions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Abnormal Transactions
            </h4>
            <div className="space-y-1">
              {insights.anomalies.transactions.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded"
                >
                  <span className="truncate max-w-[200px]">
                    {tx.originalDescription}
                  </span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    ${parseFloat(tx.originalAmount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
