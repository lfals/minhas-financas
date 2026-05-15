# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Sistema de gestão financeira pessoal: contas, lançamentos, cartões de crédito e dashboards. Next.js 16 (App Router), React 19, TypeScript strict, TailwindCSS 4, shadcn/ui, Clerk (auth), libsql/Turso como banco (SQL manual, sem ORM), Zod 4 para validação.

## Comandos

O projeto usa **bun** (`bun.lock`). Os scripts internamente chamam `next`/`eslint`/`tsc`.

- `bun run dev` — dev server (Next + Turbopack)
- `bun run build` — build de produção
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` — ESLint (`eslint-config-next`)
- `bun run format` — Prettier (`**/*.{ts,tsx}`)
- `bun run db:push-schema` — aplica `db/schema/libsql-baseline.sql` em um banco Turso vazio

Não há suíte de testes configurada. O runtime **não** aplica schema automaticamente; migração para Turso é explícita (ver `README.md`).

Variáveis de ambiente: copie `.env.example` → `.env.local` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, credenciais Clerk).

## Arquitetura

Monólito modular. Fluxo: **UI → Application → Infrastructure → libsql/Turso**.

Cada feature vive em `modules/<feature>/` (`accounts`, `transactions`, `credit-cards`, `dashboard`, `settings`) com as camadas:

- `domain/` — tipos e regras de negócio puras
- `application/` — um arquivo por caso de uso (`*-use-case.ts`); valida input com schema Zod e delega ao repository
- `infrastructure/` — `*-repository.ts` (orquestra transações) e `*-sql.ts` (strings SQL parametrizadas isoladas)
- `presentation/` — `actions.ts` (Next server actions, `"use server"`) e `view-model.ts` (montagem de dados para Server Components)

`app/` usa route groups: `(app)` para rotas autenticadas, `(auth)` para sign-in/up. Páginas são Server Components por padrão; componentes client ficam em `components/client/*.client.tsx`.

### Camada de dados (`lib/db/`)

- `pool.ts` — cliente libsql; `queryDb` para leituras simples
- `tx.ts` — `withTransaction` (foreign keys ON por padrão) e `withRawTransaction`; normaliza booleans→0/1, `Date`→ISO, `undefined`→null
- `sql.ts` — `toQueryResult` normaliza linhas: colunas `is_*` (+ allowlist) viram boolean; `bigint` vira number quando seguro

Use cases chamam o repository; o repository agrupa escritas relacionadas em `withTransaction`. SQL sempre parametrizado, nunca concatenado.

### Convenções transversais

- **Dinheiro sempre em centavos** (int). Use `lib/money` (`formatCents`, `parseCurrencyInputToCents`, `centsToAmount`)
- IDs são `TEXT` com UUID gerado na aplicação (`randomUUID()`); toda tabela tem `created_at`, `updated_at`, `clerk_user_id` (escopo por usuário)
- Auth: `getClerkUserIdOrThrow()` de `lib/auth/server` no início de cada action/use-case; nunca confie em userId do client
- Erros: hierarquia `AppError` em `lib/errors/app-error.ts` (`ValidationAppError`, `NotFoundAppError`, `ConflictAppError`, etc.) com `code`/`status`. Server actions tratam com `isAppError`
- Schemas Zod ficam em `schemas/*.schemas.ts` e são `.parse()`ados dentro dos use cases
- **Formulários devem ser sempre apresentados em modais** (ver `AGENTS.md`)

## Fluxo de agentes (ver `docs/agents/`)

- Issues e PRDs vivem como markdown em `.scratch/<feature>/` (`docs/agents/issue-tracker.md`)
- Triage usa os papéis padrão `needs-triage`/`needs-info`/`ready-for-agent`/`ready-for-human`/`wontfix` (`docs/agents/triage-labels.md`)
- Domínio single-context: um `CONTEXT.md` e `docs/adr/` na raiz (`docs/agents/domain.md`)
