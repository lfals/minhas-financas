"use client"

import type { ReactNode } from "react"

type ClickPropagationStopperProps = {
  children: ReactNode
}

export function ClickPropagationStopper({ children }: ClickPropagationStopperProps) {
  return (
    <div
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      {children}
    </div>
  )
}

