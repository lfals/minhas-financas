import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function SummaryMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  valueClassName,
  className,
}: {
  label: string
  value: string
  detail?: string
  icon?: LucideIcon
  valueClassName?: string
  className?: string
}) {
  return (
    <Card className={cn("h-full border border-white/10 bg-[#151515] ring-0", className)}>
      <CardHeader className="gap-2 pb-1 sm:gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardDescription className="text-[10px] uppercase tracking-[0.22em] text-white/55 sm:text-[11px] sm:tracking-[0.3em]">
            {label}
          </CardDescription>
          {Icon ? <Icon className="size-4 text-white/55" /> : null}
        </div>
        <CardTitle
          className={cn(
            "text-[1.7rem] leading-none font-semibold tracking-[-0.07em] text-white sm:text-3xl",
            valueClassName
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
      {detail ? (
        <CardContent className="pt-0 text-xs leading-5 text-white/60 sm:text-sm sm:leading-6">
          {detail}
        </CardContent>
      ) : null}
    </Card>
  )
}
