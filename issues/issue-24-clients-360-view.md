# Issue #24 — Aba Clientes: visão 360º (cotações, prospecções, tabelas)

**Tipo:** AFK
**Bloqueada por:** Issue #20, Issue #21

## What to build

Na tela de clientes, permitir visualizar de forma consolidada cotações, prospecções e tabelas fixas de cada cliente. Reaproveitar/expandir a página `cotacoes/por-cliente/[clientId]` (hoje já mostra cotações do cliente) para incluir abas internas — Cotações / Prospecções / Tabelas — em vez de criar telas soltas.

## Acceptance criteria

- [ ] Tela de detalhe do cliente com abas internas: Cotações, Prospecções, Tabelas
- [ ] Aba Cotações reaproveita o componente já existente em `cotacoes/por-cliente/[clientId]`
- [ ] Aba Prospecções lista as prospecções daquele cliente (issue #21)
- [ ] Aba Tabelas lista as tabelas fixas associadas ao cliente (issue #20)
- [ ] Link de acesso a partir da listagem de clientes (`/clientes`)
- [ ] Testes: dados exibidos correspondem apenas ao cliente selecionado

## Blocked by

Issue #20, Issue #21
