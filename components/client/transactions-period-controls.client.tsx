"use client"

import { startTransition } from "react"
import { addMonths, format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getDateFromIsoDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function toIsoDate(value: Date) {
  return format(value, "yyyy-MM-dd")
}

function toIsoMonth(value: string) {
  return value.slice(0, 7)
}

export function TransactionsPeriodControls({
  selectedDate,
}: {
  selectedDate: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedDay = getDateFromIsoDate(selectedDate)
  const currentMonth = toIsoMonth(toIsoDate(new Date()))

  function updateSelectedDate(nextDate: Date) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("date", toIsoDate(nextDate))

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        onClick={() => updateSelectedDate(addMonths(selectedDay, -1))}
        aria-label="Ver mês anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="min-w-0 flex-1 border border-white/10 bg-white/5 px-3 sm:flex-none">
        <Input
          type="month"
          aria-label="Selecionar mês"
          value={toIsoMonth(selectedDate)}
          onClick={() => {
            if (toIsoMonth(selectedDate) === currentMonth) {
              return
            }

            updateSelectedDate(new Date())
          }}
          onChange={(event) => {
            const value = event.currentTarget.value

            if (!value) {
              return
            }

            updateSelectedDate(new Date(`${value}-01T00:00:00`))
          }}
          className="h-8 w-full min-w-0 border-0 bg-transparent px-0 text-[11px] uppercase tracking-[0.2em] text-white shadow-none sm:w-[9.5rem] focus-visible:ring-0"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        onClick={() => updateSelectedDate(addMonths(selectedDay, 1))}
        aria-label="Ver próximo mês"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
