"use client"

import { useEffect, useState } from "react"

import type { TransactionTitleSuggestion } from "@/modules/transactions/domain/types"

let cached: TransactionTitleSuggestion[] | null = null
let inflight: Promise<TransactionTitleSuggestion[]> | null = null

const bumpListeners = new Set<() => void>()

export function invalidateTransactionTitleSuggestionsCache() {
  cached = null
  for (const listener of bumpListeners) {
    listener()
  }
}

async function loadTitleSuggestions(): Promise<TransactionTitleSuggestion[]> {
  if (cached) {
    return cached
  }

  if (inflight) {
    return inflight
  }

  inflight = (async () => {
    const response = await fetch("/api/transactions/title-suggestions", {
      credentials: "same-origin",
      cache: "no-store",
    })
    const body = (await response.json()) as { ok?: boolean; data?: TransactionTitleSuggestion[] }

    if (!response.ok || body.ok !== true || !Array.isArray(body.data)) {
      return []
    }

    cached = body.data

    return body.data
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export function useTransactionTitleSuggestions(enabled: boolean): TransactionTitleSuggestion[] {
  const [version, bump] = useState(0)

  useEffect(() => {
    const listener = () => bump((v) => v + 1)

    bumpListeners.add(listener)

    return () => {
      bumpListeners.delete(listener)
    }
  }, [])

  const [data, setData] = useState<TransactionTitleSuggestion[]>(() =>
    enabled && cached ? cached : []
  )

  useEffect(() => {
    if (!enabled) {
      setData([])
      return
    }

    let cancelled = false

    loadTitleSuggestions().then((rows) => {
      if (!cancelled) {
        setData(rows)
      }
    })

    return () => {
      cancelled = true
    }
  }, [enabled, version])

  return data
}
