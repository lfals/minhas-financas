# Sistema Financeiro Pessoal

Este repositório contém a **documentação base para desenvolvimento assistido por Codex** de um sistema de gestão financeira pessoal.

## Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Clerk (auth)
- PostgreSQL
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
2. Suba o banco com `docker compose up -d`.
3. O projeto já inclui `DATABASE_URL` apontando para o PostgreSQL local em `compose.yaml`.
4. Preencha as credenciais do Clerk.
5. Rode `npm run dev`.

O schema inicial de contas é aplicado automaticamente a partir de `db/migrations/` na primeira conexão com o banco.
