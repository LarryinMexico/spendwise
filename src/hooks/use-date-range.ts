"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import type { DateRange } from "react-day-picker";

export type DateRangePreset =
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "last3Months"
  | "custom";

export function useDateRange() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [preset, setPreset] = useState<DateRangePreset>("thisMonth");

  const setDateRange = (
    newDate: DateRange,
    newPreset: DateRangePreset | "custom" = "custom"
  ) => {
    setDate(newDate);
    if (newPreset !== "custom") {
      setPreset(newPreset);
    }
  };

  const setPresetRange = (newPreset: DateRangePreset) => {
    const now = new Date();
    let from, to;

    switch (newPreset) {
      case "thisMonth":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case "last3Months":
        from = startOfMonth(subMonths(now, 2));
        to = endOfMonth(now);
        break;
      case "thisYear":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
    }

    setPreset(newPreset);
    setDate({ from, to });
  };

  const formattedDateRange =
    date?.from && date.to
      ? `${format(date.from, "yyyy-MM-dd")} ~ ${format(date.to, "yyyy-MM-dd")}`
      : "Select a date range";

  return {
    date,
    setDate: setDateRange,
    preset,
    setPreset: setPresetRange,
    formattedDateRange,
  };
}
