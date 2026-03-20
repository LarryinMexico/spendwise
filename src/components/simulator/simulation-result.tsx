"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

interface SimulationResultProps {
  explanation: string;
  isLoading: boolean;
  savings12Months: number;
}

export function SimulationResult({
  explanation,
  isLoading,
  savings12Months,
}: SimulationResultProps) {
  return (
    <Card className="col-span-1 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Analysis
        </CardTitle>
        <CardDescription>
          How this adjustment impacts your financial future.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {savings12Months !== 0 && (
          <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">
              Projected 12-Month Impact
            </p>
            <p
              className={`text-2xl font-bold ${
                savings12Months > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {savings12Months > 0 ? "+" : "-"}$
              {Math.abs(savings12Months).toFixed(2)}
            </p>
          </div>
        )}

        <div className="flex-1 relative min-h-[150px]">
          {isLoading && !explanation ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : explanation ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed">{explanation}</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
              Adjust the slider to see how changes in your spending habits affect your long-term financial goals.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
