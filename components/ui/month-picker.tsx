"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, setMonth, setYear } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type MonthPickerProps = {
  value?: string // YYYY-MM
  onChange?: (month: string) => void
  className?: string
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [viewDate, setViewDate] = React.useState(() => {
    if (value) {
      try {
        const date = new Date(`${value}-01T00:00:00`)
        if (!isNaN(date.getTime())) return date
      } catch (e) {}
    }
    return new Date()
  })

  // Synchronize viewDate when value changes externally (if applicable)
  React.useEffect(() => {
    if (value) {
      try {
        const date = new Date(`${value}-01T00:00:00`)
        if (!isNaN(date.getTime())) setViewDate(date)
      } catch (e) {}
    }
  }, [value])

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => setMonth(viewDate, i))
  }, [viewDate])

  const handleYearChange = (offset: number) => {
    setViewDate((prev) => setYear(prev, prev.getFullYear() + offset))
  }

  const handleMonthClick = (monthDate: Date) => {
    onChange?.(format(monthDate, "yyyy-MM"))
  }

  const currentYear = viewDate.getFullYear()

  return (
    <div className={cn("w-64 p-3", className)}>
      <div className="flex items-center justify-between mb-4 px-1">
        <Button
          variant="ghost"
          className="h-7 w-7 p-0 text-white/50 hover:bg-white/10 hover:text-white"
          onClick={() => handleYearChange(-1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium text-white">{currentYear}</div>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0 text-white/50 hover:bg-white/10 hover:text-white"
          onClick={() => handleYearChange(1)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {months.map((month) => {
          const monthKey = format(month, "yyyy-MM")
          const isSelected = value === monthKey
          
          return (
            <Button
              key={monthKey}
              variant="ghost"
              className={cn(
                "h-9 w-full text-xs font-normal capitalize text-white/70 hover:bg-white/10 hover:text-white",
                isSelected && "bg-[#d8f36a] text-black hover:bg-[#c9e45f] hover:text-black font-semibold"
              )}
              onClick={() => handleMonthClick(month)}
              type="button"
            >
              {format(month, "MMM", { locale: ptBR }).replace(".", "")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
