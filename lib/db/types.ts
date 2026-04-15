export type QueryResultRow = Record<string, unknown>

export type QueryResult<T extends QueryResultRow = QueryResultRow> = {
  columns: string[]
  lastInsertRowid: bigint | undefined
  rowCount: number
  rows: T[]
  rowsAffected: number
}

export interface DatabaseClient {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<T>>
  release(): Promise<void> | void
}
