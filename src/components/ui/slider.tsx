"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  className?: string;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function Slider({
  className,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
}: SliderProps) {
  // Take first value from array or fallback to 0
  const currentValue = value && value.length > 0 ? value[0] : min;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    if (onValueChange) {
      onValueChange([newVal]);
    }
  };

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex w-full items-center select-none", className)}>
      <div className="relative w-full h-1 bg-muted rounded-full">
        {/* Track Fill / Range Indicator */}
        <div 
          className="absolute h-full bg-primary rounded-full" 
          style={{ width: `${percentage}%` }}
        />
        {/* Standard HTML Input, fully styled on top with Tailwind */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "absolute inset-0 w-full h-1 bg-transparent opacity-0 cursor-pointer appearance-none",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        />
        {/* Static Thump / Handle Visuals representing range accurately */}
        <div 
          className={cn(
            "absolute size-4 -mt-1.5 -ml-2 rounded-full border-2 border-primary bg-white ring-offset-background transition-colors",
            "pointer-events-none"
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
