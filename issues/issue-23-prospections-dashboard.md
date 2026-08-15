# Issue #23 — Dashboard e filtros da aba Prospecções

**Tipo:** AFK
**Bloqueada por:** Issue #21

## What to build

Nova aba "Prospecções" com listagem e dashboard, reaproveitando o padrão de `QuotationFilters`/`MultiSelectFilter` (`src/app/(dashboard)/cotacoes/quotation-filters.tsx`) e `src/lib/quotation/list-filters.ts`, adaptado aos campos e status de prospecções. Dashboard com métricas equivalentes ao de cotações (`src/lib/dashboard/metrics.ts` / `period-filter.tsx`), como quantidade por status, por segmento, por período.

## Acceptance criteria

- [ ] Página `/prospeccoes` com filtros GET (busca, cliente, segmento, status, responsável, intervalo de datas), reaproveitando `MultiSelectFilter`
- [ ] Parser de filtros equivalente a `list-filters.ts`, adaptado a `ProspectionListFilters`
- [ ] Dashboard de prospecções com `PeriodFilter` (mesmo padrão MÊS/TRIMESTRE/ANO/personalizado)
- [ ] Métricas: quantidade por status, taxa de resposta (validar com a usuária quais números exibir)
- [ ] Testes: parsing de filtros e cálculo de métricas por período

## Blocked by

Issue #21
