declare module "pg" {
  export interface QueryResultRow {
    [column: string]: unknown
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    command: string
    rowCount: number | null
    rows: R[]
  }

  export class PoolClient {
    query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[]
    ): Promise<QueryResult<R>>
    release(): void
  }

  export class Pool {
    constructor(config?: {
      connectionString?: string
      max?: number
      idleTimeoutMillis?: number
      connectionTimeoutMillis?: number
      statement_timeout?: number
    })

    query<R extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[]
    ): Promise<QueryResult<R>>

    connect(): Promise<PoolClient>
  }
}
