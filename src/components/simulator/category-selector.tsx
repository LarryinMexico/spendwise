"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  disabled?: boolean;
}

export function CategorySelector({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled = false,
}: CategorySelectorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-2">
        <div className="h-5 w-20 bg-muted animate-pulse rounded" />
        <div className="h-8 w-full bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="category-select" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Select Category
      </label>
      <Select
        value={selectedCategory}
        onValueChange={(value: string | null) => {
          if (value !== null) onCategoryChange(value);
        }}
        disabled={disabled || categories.length === 0}
      >
        <SelectTrigger id="category-select" className="w-full">
          <SelectValue placeholder="Select category to adjust" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
