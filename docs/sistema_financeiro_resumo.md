# Sistema de Gestão Financeira Pessoal

## Visão Geral

Aplicação **web + PWA** para organização completa da vida financeira
pessoal.

O sistema permite controlar: - contas e saldos - despesas e receitas -
cartões de crédito e faturas - contas recorrentes - investimentos -
proventos - rentabilidade baseada em CDI ou valorização de ativos

A arquitetura prioriza **performance, previsibilidade e experiência do
usuário**, explorando ao máximo os recursos do **Next.js App Router**.

------------------------------------------------------------------------

# Stack Tecnológica

## Frontend / Fullstack

-   Next.js (App Router)
-   React
-   TailwindCSS
-   shadcn/ui

Estratégia: - Server Components por padrão - Client Components apenas
para interatividade

## Backend

-   Backend integrado ao Next.js
-   SQL manual (sem ORM)
-   PostgreSQL

Bibliotecas: - Zod --- validação e tipagem - Effect --- composição de
casos de uso e tratamento de erro

## Autenticação

-   Clerk

Responsável por: - login - cadastro - sessão - proteção de rotas -
identidade do usuário

Cada entidade do sistema utiliza `clerkUserId` para isolamento de dados.

------------------------------------------------------------------------

# Princípios Arquiteturais

## Performance First

O sistema prioriza performance real e percebida:

-   Server Components
-   Prefetch agressivo de rotas
-   Streaming de dados
-   Suspense boundaries
-   Cache inteligente
-   Revalidação seletiva
-   Client Islands pequenas

## Separação de Domínio

### Fluxo de Caixa

Movimentações do dia a dia: - despesas - receitas - transferências -
pagamentos

### Obrigações

Compromissos financeiros: - faturas - parcelas - contas recorrentes

### Patrimônio

Controle de investimentos: - ações - FIIs - renda fixa - ETFs - cripto -
fundos

------------------------------------------------------------------------

# Módulos do Sistema

## Contas

-   cadastro de contas
-   saldo atual
-   extrato
-   transferências entre contas

Tipos: - conta corrente - poupança - carteira - conta investimento

## Lançamentos

-   despesas
-   receitas
-   transferências
-   ajustes de saldo
-   categorização
-   histórico

## Cartões de Crédito

-   cadastro de cartões
-   limite total e disponível
-   registro de compras
-   parcelamentos

## Faturas

-   cálculo automático
-   pagamento total ou parcial
-   histórico

Regra: compras após o fechamento entram na próxima fatura.

## Contas Recorrentes

Automação de despesas fixas: - aluguel - energia - internet -
assinaturas

## Investimentos

Suporte para: - renda fixa - ações - FIIs - ETFs - fundos - cripto

Funções: - registro de aplicações - registro de resgates - cálculo de
custo médio - posição consolidada

## Proventos

Eventos de rendimento: - dividendos - JCP - rendimento de FII -
amortizações - bonificações

## Rentabilidade

Renda fixa: - CDI - % do CDI - CDI + spread - taxa prefixada

Renda variável: retorno = valorização + proventos

------------------------------------------------------------------------

# Dashboard

Indicadores principais:

-   saldo consolidado
-   gastos do mês
-   contas a vencer
-   fatura atual
-   patrimônio total
-   rentabilidade
-   proventos recebidos
-   fluxo de caixa futuro

Cada bloco carrega de forma independente usando streaming.

------------------------------------------------------------------------

# Estrutura de Dados

Principais entidades:

-   users
-   accounts
-   transactions
-   transfers
-   credit_cards
-   invoices
-   invoice_items
-   recurrences
-   assets
-   investment_movements
-   proceeds
-   benchmark_rates
-   asset_prices

------------------------------------------------------------------------

# Convenções Técnicas

## Dinheiro

Valores armazenados em **centavos**.

Exemplo: 15990 = R\$159,90

## Datas

Separação entre:

-   data da transação
-   competência
-   liquidação
-   vencimento
-   fechamento da fatura

## Auditoria

Movimentações financeiras são **imutáveis**. Correções devem ocorrer via
estorno ou ajuste.

------------------------------------------------------------------------

# Estratégia de Performance

## Server Components

Renderização no servidor sempre que possível.

## Prefetch

Rotas importantes são pré-carregadas para navegação instantânea.

## Streaming

Carregamento progressivo de partes da tela.

## Cache

Cache aplicado de acordo com o tipo de dado.

## Revalidação

Somente dados afetados são atualizados após mutações.

------------------------------------------------------------------------

# PWA

Aplicação instalável com:

-   cache de assets
-   acesso rápido
-   reentrada instantânea

Escrita offline não é suportada no MVP para evitar inconsistências
financeiras.

------------------------------------------------------------------------

# Objetivo do Projeto

Construir um sistema financeiro pessoal:

-   performático
-   previsível
-   consistente
-   escalável

Focado em **controle financeiro completo com excelente experiência de
uso**.
