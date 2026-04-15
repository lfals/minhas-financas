# Sistema Financeiro Pessoal

Este repositório contém a **documentação base para desenvolvimento assistido por Codex** de um sistema de gestão financeira pessoal.

## Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Clerk (auth)
- libsql + Turso
- SQL manual
- Zod
- Effect (backend)

## Princípios

- Performance first
- Server Components por padrão
- Prefetch de rotas principais
- SQL explícito
- Validação com Zod
- Sem ORM
- Dinheiro armazenado em centavos

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.
3. Rode `npm run db:push-schema` para aplicar o baseline em um banco Turso vazio.
4. Preencha as credenciais do Clerk.
5. Rode `npm run dev`.

## Migração assistida do PostgreSQL

O runtime não aplica schema automaticamente. O fluxo de migração para Turso é explícito:

1. Configure `DATABASE_URL` com o PostgreSQL legado.
2. Rode `npm run db:migrate-from-postgres`.
3. Importe o arquivo gerado em `tmp/minhas-financas-turso.db` com `npm run db:import-turso`.
4. Aponte a aplicação para `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.

O baseline SQLite/libsql fica em `db/schema/libsql-baseline.sql`.

## Observações

- `compose.yaml` permanece apenas como apoio legado para exportação one-off a partir do PostgreSQL antigo.
- O banco continua sem ORM e com SQL manual.
