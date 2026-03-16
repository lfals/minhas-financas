# Arquitetura

## Estilo

Monólito modular com Next.js.

Fluxo:

UI → Application → Infrastructure → PostgreSQL

## Camadas

UI
- páginas
- componentes

Application
- casos de uso

Domain
- regras de negócio

Infrastructure
- SQL
- integrações
