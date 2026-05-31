# Issue #05 — Formulário de cotação (sem PDF)

**Tipo:** AFK  
**Bloqueada por:** Issues #03 e #04

## What to build

Formulário completo de criação de cotação com todos os campos especificados, incluindo a hierarquia condicional de tipos de operação, trechos dinâmicos com autocompletar Google Maps e seleção de adicionais. A cotação é salva no banco mas ainda não gera PDF.

## Acceptance criteria

- [ ] Tabela `quotations` com todos os campos do schema definido no PRD
- [ ] Tabela `quotation_legs` (trechos): id, quotation_id, origin, destination, value, order
- [ ] Tabela `quotation_additionals` (relação N:N)
- [ ] Campo "Cliente": dropdown da lista de clientes cadastrados
- [ ] Campos: Remetente, Destinatário (texto livre)
- [ ] Campo "Segmento": seleção única — Café ou Indústria
- [ ] Campo "Produto": texto livre
- [ ] Campo "Tipo de veículo": dropdown (Carreta LS, Rodotrem, Bitruck)
- [ ] Campo "Tipo de valor": dropdown (Por container, Por veículo, Por operação)
- [ ] Hierarquia de Tipo de Operação implementada corretamente:
  - Importação > DTA > (Baixa de container / Desova / Sobre rodas / Outros)
  - Importação > DI (sem subtipo)
  - Importação > Outro (texto livre)
  - Exportação > Operação direta
  - Exportação > Operação com mapa > campo "Cidade do mapa" (texto livre)
- [ ] Seção de trechos dinâmica: adicionar/remover trechos com Origem e Destino via Google Maps Places API e campo Valor
- [ ] Campo "Cidade retirada/entrega container vazio": dropdown da lista de portos cadastrados
- [ ] Seleção de adicionais com checkboxes e exibição do total
- [ ] Seleção de certificações para incluir no PDF (banco de imagens)
- [ ] Geração do identificador único: NS_IMP_XXXX ou NS_EXP_XXXX (sequencial, sem colisão)
- [ ] Cotação salva com status "RASCUNHO"
- [ ] Testes: geração do ID único, hierarquia de operação, cálculo de total de adicionais

## Blocked by

Issues #03 e #04
