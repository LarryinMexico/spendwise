"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AdjustmentSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function AdjustmentSlider({
  value,
  onChange,
  disabled = false,
}: AdjustmentSliderProps) {
  // Handle SSR - only render slider on client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          支出調整
        </label>
        <span
          className={cn(
            "text-sm font-bold",
            value > 0 ? "text-red-500" : value < 0 ? "text-green-500" : "text-muted-foreground"
          )}
        >
          {value > 0 ? "+" : ""}
          {value}%
        </span>
      </div>
      {mounted ? (
        <Slider
          defaultValue={[0]}
          value={[value]}
          onValueChange={(vals) => {
            const val = Array.isArray(vals) ? vals[0] : vals;
            onChange(val as number);
          }}
          max={50}
          min={-80}
          step={5}
          disabled={disabled}
          className="py-4"
        />
      ) : (
        <div className="h-10 bg-muted rounded-md animate-pulse" />
      )}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>-80%</span>
        <span>0%</span>
        <span>+50%</span>
      </div>
    </div>
  );
}
