"use client"

import * as React from "react"

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

export function ResponsiveMetrics({
  children,
  mobileItemClassName = "basis-[90%] pl-0",
  gridClassName,
  className,
}: {
  children: React.ReactNode
  mobileItemClassName?: string
  gridClassName: string
  className?: string
}) {
  const items = React.Children.toArray(children)

  return (
    <section className={className}>
      <div className="sm:hidden">
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="!-ml-0">
            {items.map((item, index) => (
              <CarouselItem key={index} className={mobileItemClassName}>
                {item}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className={cn("hidden sm:grid", gridClassName)}>{items}</div>
    </section>
  )
}
