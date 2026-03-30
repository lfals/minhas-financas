"use client"

import * as React from "react"

type DialogViewportStyle = React.CSSProperties & {
  [key: `--${string}`]: string
}

function readViewport() {
  if (typeof window === "undefined") {
    return {
      height: 0,
      offsetTop: 0,
    }
  }

  const viewport = window.visualViewport

  if (!viewport) {
    return {
      height: window.innerHeight,
      offsetTop: 0,
    }
  }

  return {
    height: viewport.height,
    offsetTop: viewport.offsetTop,
  }
}

export function useDialogViewportStyle(style?: React.CSSProperties) {
  const [viewport, setViewport] = React.useState(readViewport)
  const updateViewport = React.useEffectEvent(() => {
    const next = readViewport()

    setViewport((current) => {
      if (current.height === next.height && current.offsetTop === next.offsetTop) {
        return current
      }

      return next
    })
  })

  React.useEffect(() => {
    updateViewport()

    const visualViewport = window.visualViewport

    window.addEventListener("resize", updateViewport)
    visualViewport?.addEventListener("resize", updateViewport)
    visualViewport?.addEventListener("scroll", updateViewport)

    return () => {
      window.removeEventListener("resize", updateViewport)
      visualViewport?.removeEventListener("resize", updateViewport)
      visualViewport?.removeEventListener("scroll", updateViewport)
    }
  }, [updateViewport])

  return React.useMemo<DialogViewportStyle>(
    () => ({
      ...style,
      "--dialog-viewport-height": `${viewport.height || 0}px`,
      "--dialog-viewport-top": `${viewport.offsetTop || 0}px`,
    }),
    [style, viewport.height, viewport.offsetTop]
  )
}
