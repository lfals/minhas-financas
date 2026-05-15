"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters"
import type { DashboardMonthDayForecastPoint } from "@/modules/dashboard/domain/types"

const chartConfig = {
  balance: {
    label: "Saldo previsto",
    color: "var(--chart-1)",
  },
  entrada: {
    label: "Entrada prevista",
    color: "var(--chart-2)",
  },
  saida: {
    label: "Saída prevista",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

type ChartRow = {
  dateIso: string
  dayLabel: string
  balance: number
  entrada: number
  saida: number
}

type DashboardMonthForecastChartProps = {
  points: DashboardMonthDayForecastPoint[]
  periodLabel: string
}

export function DashboardMonthForecastChart({ points, periodLabel }: DashboardMonthForecastChartProps) {
  const data: ChartRow[] = points.map((point) => ({
    dateIso: point.dateIso,
    dayLabel: point.dayLabel,
    balance: point.balanceCents / 100,
    entrada: point.pendingIncomeCents / 100,
    saida: point.pendingExpenseCents / 100,
  }))

  if (!data.length) {
    return null
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[min(22rem,55vh)] w-full min-h-[17rem]"
    >
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="dayLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          className="text-[11px]"
        />
        <YAxis
          yAxisId="left"
          width={56}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCompactCurrency(Number(value))}
          className="text-[10px] tabular-nums"
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          width={56}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCompactCurrency(Number(value))}
          className="text-[10px] tabular-nums"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as ChartRow | undefined
                if (!row?.dateIso) return periodLabel
                return format(parseISO(row.dateIso), "dd MMM yyyy", { locale: ptBR })
              }}
              formatter={(value, name) => {
                const key = String(name)
                const label =
                  key === "balance"
                    ? chartConfig.balance.label
                    : key === "entrada"
                      ? chartConfig.entrada.label
                      : chartConfig.saida.label
                return (
                  <div className="flex w-full min-w-[12rem] items-center justify-between gap-6">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                )
              }}
            />
          }
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="balance"
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="entrada"
          stroke="var(--color-entrada)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="saida"
          stroke="var(--color-saida)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </ComposedChart>
    </ChartContainer>
  )
}
