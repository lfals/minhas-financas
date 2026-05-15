"use client"

import { startTransition } from "react"
import { addMonths, format, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function toIsoMonth(date: Date) {
  return format(date, "yyyy-MM")
}

type DashboardChartMonthSelectorProps = {
  /** Mês exibido no gráfico (`yyyy-MM`), alinhado a `filter.month` em modo mês. */
  month: string
}

export function DashboardChartMonthSelector({ month }: DashboardChartMonthSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateSearchParams(updater: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    updater(params)

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  function setMonth(nextMonth: string) {
    updateSearchParams((params) => {
      params.set("mode", "month")
      params.set("month", nextMonth)
      params.delete("startDate")
      params.delete("endDate")
    })
  }

  function shiftMonth(offset: number) {
    const nextMonth = toIsoMonth(addMonths(parseISO(`${month}-01`), offset))
    setMonth(nextMonth)
  }

  function useCurrentMonth() {
    setMonth(toIsoMonth(new Date()))
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        onClick={() => shiftMonth(-1)}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="min-w-0 border border-white/10 bg-white/5 px-2 sm:px-3">
        <Input
          type="month"
          aria-label="Selecionar mês do gráfico"
          value={month}
          onChange={(event) => {
            const value = event.currentTarget.value
            if (!value) {
              return
            }
            setMonth(value)
          }}
          className="h-8 w-full min-w-0 border-0 bg-transparent px-0 text-[11px] uppercase tracking-[0.2em] text-white shadow-none sm:w-[9.5rem] focus-visible:ring-0"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        onClick={() => shiftMonth(1)}
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-4" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        onClick={useCurrentMonth}
      >
        Atual
      </Button>
    </div>
  )
}
