# Issue #19 — Exportação: duas origens/destinos (dupla coleta)

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Na operação de Exportação, permitir registrar até duas coletas (duas origens/destinos), reaproveitando o padrão de agrupamento já existente para Importação DTA/DI (`LegRow.legGroup` em `src/app/(dashboard)/cotacoes/nova/legs-editor.tsx`, que hoje agrupa trechos visualmente em "Trechos — DTA" / "Trechos — DI" via `LegGroupBlock`).

Estender esse mesmo padrão para `operation_type === 'EXPORTACAO'`, com os rótulos "Coleta 1" / "Coleta 2".

## Acceptance criteria

- [ ] `legGroup` em `LegRow` aceita valores adicionais para o contexto de exportação (ex.: `'COLETA_1' | 'COLETA_2'`), além dos já existentes `'DTA' | 'DI'`
- [ ] `LegsEditor` exibe os blocos agrupados "Coleta 1" / "Coleta 2" quando `operation_type === 'EXPORTACAO'` e o usuário optar por duas coletas — exportação com coleta única continua funcionando como hoje (opcional, não obrigatório)
- [ ] Cálculo de totais (`src/lib/quotation/summary.ts`) soma corretamente os trechos das duas coletas
- [ ] PDF gerado reflete as duas coletas separadamente, no mesmo padrão visual usado hoje para DTA/DI
- [ ] Testes: cálculo de total com trechos distribuídos entre as duas coletas

## Blocked by

Nada — pode começar imediatamente
