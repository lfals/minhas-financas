import type { QueryResultRow } from "@/lib/db/types"

const BOOLEAN_COLUMNS = new Set([
  "auto_categorization_enabled",
  "include_in_net_worth",
])

function isBooleanColumn(columnName: string) {
  return columnName.startsWith("is_") || BOOLEAN_COLUMNS.has(columnName)
}

function normalizeRowValue(columnName: string, value: unknown) {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === "number" && isBooleanColumn(columnName) && (value === 0 || value === 1)) {
    return value === 1
  }

  if (typeof value === "bigint") {
    if (isBooleanColumn(columnName) && (value === BigInt(0) || value === BigInt(1))) {
      return value === BigInt(1)
    }

    return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString()
  }

  return value
}

type ResultSetLike = {
  columns?: string[]
  lastInsertRowid?: bigint
  rows?: unknown[]
  rowsAffected?: number
}

function normalizeRow(columns: string[], row: unknown) {
  if (Array.isArray(row)) {
    return Object.fromEntries(
      columns.map((columnName, index) => [
        columnName,
        normalizeRowValue(columnName, row[index]),
      ])
    )
  }

  if (row && typeof row === "object") {
    return Object.fromEntries(
      columns.map((columnName) => [
        columnName,
        normalizeRowValue(columnName, (row as Record<string, unknown>)[columnName]),
      ])
    )
  }

  return {}
}

export function toQueryResult<T extends QueryResultRow = QueryResultRow>(result: ResultSetLike) {
  const columns = result.columns ?? []
  const rows = (result.rows ?? []).map((row) => normalizeRow(columns, row) as T)

  return {
    columns,
    lastInsertRowid: result.lastInsertRowid,
    rowCount: rows.length,
    rows,
    rowsAffected: result.rowsAffected ?? 0,
  }
}
