# Arquitetura

## Estilo

Monólito modular com Next.js.

Fluxo:

UI → Application → Infrastructure → libsql/Turso

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
- cliente libsql
