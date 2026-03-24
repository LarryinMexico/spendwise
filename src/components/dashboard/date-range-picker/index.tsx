"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import type { DateRangePreset } from "@/hooks/use-date-range";

interface DateRangePickerProps {
  date?: DateRange;
  setDate: (date: DateRange, preset?: DateRangePreset) => void;
  preset: DateRangePreset;
  setPreset: (preset: DateRangePreset) => void;
}

export function DateRangePicker({
  date,
  setDate,
  preset,
  setPreset,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {new Date(date.from).toLocaleDateString()} -{" "}
                {new Date(date.to).toLocaleDateString()}
              </>
            ) : (
              new Date(date.from).toLocaleDateString()
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between p-2">
          <Select
            value={preset}
            onValueChange={(value) => setPreset(value as DateRangePreset)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsOpen(false)} variant="ghost">
            Done
          </Button>
        </div>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={(range) =>
            setDate(
              range || { from: undefined, to: undefined },
              range ? "custom" : preset
            )
          }
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
