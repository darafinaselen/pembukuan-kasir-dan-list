"use client";

import * as React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateTimePicker({ date, setDate, className }) {
  const [selectedDate, setSelectedDate] = React.useState(date);
  const [timeValue, setTimeValue] = React.useState(
    date ? format(date, "HH:mm") : "00:00"
  );

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setTimeValue(format(date, "HH:mm"));
    }
  }, [date]);

  const handleDateSelect = (newDate) => {
    if (!newDate) return;

    // Combine selected date with current time
    const [hours, minutes] = timeValue.split(":").map(Number);
    newDate.setHours(hours, minutes, 0, 0);

    setSelectedDate(newDate);
    setDate(newDate);
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    setTimeValue(time);

    if (!selectedDate) return;

    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);

    setSelectedDate(newDate);
    setDate(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP HH:mm", { locale: id })
          ) : (
            <span>Pilih tanggal & waktu</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
          locale={id}
        />
        <div className="p-3 border-t border-border">
          <Label className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Waktu (24 jam)
          </Label>
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="mt-2"
            step="60"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DatePicker({ date, setDate, className }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP", { locale: id })
          ) : (
            <span>Pilih tanggal</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={id}
        />
      </PopoverContent>
    </Popover>
  );
}
