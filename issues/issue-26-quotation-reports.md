# Issue #26 — Relatórios de Cotações por filtro

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Na aba Cotações, permitir gerar um relatório a partir dos filtros aplicados (data, cliente, etc. — reaproveitando `src/lib/quotation/list-filters.ts`), exibindo quantidades por status (aprovadas, recusadas, aguardando, etc.) em formato de tabela, com opção de exportação.

## Acceptance criteria

- [ ] Botão "Gerar relatório" na tela de cotações, respeitando os filtros ativos no momento
- [ ] Relatório em tabela: contagem por status, e por cliente/período conforme os filtros aplicados
- [ ] Exportação do relatório (CSV no mínimo; PDF se viável reaproveitando Puppeteer)
- [ ] Testes: contagens batem com os dados filtrados

## Blocked by

Nada — pode começar imediatamente
