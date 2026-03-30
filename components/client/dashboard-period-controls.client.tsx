"use client"

import { startTransition, useState } from "react"
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns"
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { DashboardFilter } from "@/modules/dashboard/domain/types"

function toIsoMonth(date: Date) {
  return format(date, "yyyy-MM")
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function getRangeForMonth(month: string) {
  const monthDate = parseISO(`${month}-01`)

  return {
    startDate: toIsoDate(startOfMonth(monthDate)),
    endDate: toIsoDate(endOfMonth(monthDate)),
  }
}

export function DashboardPeriodControls({ filter }: { filter: DashboardFilter }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(filter.startDate)
  const [endDate, setEndDate] = useState(filter.endDate)
  const [error, setError] = useState<string | null>(null)

  function updateSearchParams(updater: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    updater(params)

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setStartDate(filter.startDate)
      setEndDate(filter.endDate)
      setError(null)
    }
  }

  function setMonthMode(nextMonth: string) {
    updateSearchParams((params) => {
      params.set("mode", "month")
      params.set("month", nextMonth)
      params.delete("startDate")
      params.delete("endDate")
    })
  }

  function setCustomMode(nextStartDate: string, nextEndDate: string) {
    updateSearchParams((params) => {
      params.set("mode", "custom")
      params.set("startDate", nextStartDate)
      params.set("endDate", nextEndDate)
      params.set("month", nextStartDate.slice(0, 7))
    })
  }

  function handleMonthNavigation(offset: number) {
    const nextMonth = toIsoMonth(addMonths(parseISO(`${filter.month}-01`), offset))
    setMonthMode(nextMonth)
  }

  function handleCustomSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!startDate || !endDate) {
      setError("Informe a data inicial e final.")
      return
    }

    if (startDate > endDate) {
      setError("A data inicial não pode ser maior que a final.")
      return
    }

    setError(null)
    setCustomMode(startDate, endDate)
    setOpen(false)
  }

  function useCurrentMonth() {
    const currentMonth = toIsoMonth(new Date())
    setMonthMode(currentMonth)
  }

  function switchToCustomMode() {
    if (filter.mode === "custom") {
      return
    }

    const { startDate: nextStartDate, endDate: nextEndDate } = getRangeForMonth(filter.month)
    setCustomMode(nextStartDate, nextEndDate)
  }

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={
            filter.mode === "month"
              ? "border-[#d8f36a] bg-[#d8f36a] text-black hover:bg-[#c9e45f]"
              : "border-white/10 bg-white/5 text-white hover:bg-white/10"
          }
          onClick={() => setMonthMode(filter.month)}
        >
          Mês
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={
            filter.mode === "custom"
              ? "border-[#d8f36a] bg-[#d8f36a] text-black hover:bg-[#c9e45f]"
              : "border-white/10 bg-white/5 text-white hover:bg-white/10"
          }
          onClick={switchToCustomMode}
        >
          Personalizado
        </Button>
      </div>

      {filter.mode === "month" ? (
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => handleMonthNavigation(-1)}
            aria-label="Ver mês anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="min-w-0 flex-1 border border-white/10 bg-white/5 px-3 sm:flex-none">
            <Input
              type="month"
              aria-label="Selecionar mês"
              value={filter.month}
              onChange={(event) => {
                const value = event.currentTarget.value

                if (!value) {
                  return
                }

                setMonthMode(value)
              }}
              className="h-8 w-full min-w-0 border-0 bg-transparent px-0 text-[11px] uppercase tracking-[0.2em] text-white shadow-none sm:w-[9.5rem] focus-visible:ring-0"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => handleMonthNavigation(1)}
            aria-label="Ver próximo mês"
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
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/75">
            {filter.periodLabel}
          </p>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <CalendarRange className="size-4" />
                Alterar intervalo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg border border-white/10 bg-[#141414] p-0 text-white ring-0">
              <DialogHeader className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                <DialogTitle className="text-2xl font-semibold uppercase tracking-[-0.07em] text-white">
                  Intervalo personalizado
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-white/60">
                  Defina o período que deve ser refletido por todos os blocos do dashboard.
                </DialogDescription>
              </DialogHeader>

              <form className="grid gap-4 px-4 py-4 sm:px-6 sm:py-5" onSubmit={handleCustomSubmit}>
                <label className="grid gap-2 text-[11px] uppercase tracking-[0.22em] text-white/65">
                  Data inicial
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.currentTarget.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </label>

                <label className="grid gap-2 text-[11px] uppercase tracking-[0.22em] text-white/65">
                  Data final
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.currentTarget.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </label>

                {error ? <p className="text-sm text-[#ff9c7a]">{error}</p> : null}

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/10 bg-transparent text-white hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#d8f36a] text-black hover:bg-[#c9e45f]">
                    Aplicar intervalo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
