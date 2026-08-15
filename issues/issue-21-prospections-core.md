# Issue #21 — Módulo de Prospecções: schema, CRUD, status, observações

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Nova entidade "Prospecção" — apresentações comerciais enviadas a possíveis novos clientes. Tabela `prospections` com: `id, client_id` (ou dados de contato livres, se o prospect ainda não é cliente cadastrado), `created_by, segment` (`'INDUSTRIA' | 'CAFE'`, extensível), `status, notes` (observações livres), `created_at`. Histórico de eventos em `prospection_events` (mesmo padrão de `quotation_events`).

Status próprios, diferentes dos de cotação: `ENVIADA`, `RESPONDIDA_PELO_CLIENTE`, `SEM_RETORNO`, `TABELA_ENVIADA`, `COTACAO_ENVIADA`, `OPERACAO_FECHADA`, `OPERACAO_RECUSADA`.

## Acceptance criteria

- [ ] Migration: tabela `prospections` (schema acima) e `prospection_events`, com RLS equivalente à de `quotations` (comercial vê as próprias, admin vê todas — confirmar com a usuária se Operação também precisa ver)
- [ ] Enum de status: `ENVIADA, RESPONDIDA_PELO_CLIENTE, SEM_RETORNO, TABELA_ENVIADA, COTACAO_ENVIADA, OPERACAO_FECHADA, OPERACAO_RECUSADA`
- [ ] Campo de observações (texto livre, editável a qualquer momento, sem afetar o status)
- [ ] Formulário de criação/edição de prospecção (cliente ou contato avulso, segmento, observações)
- [ ] Transições de status registradas em `prospection_events` (quem mudou, quando, de/para)
- [ ] Testes: transições de status e validação de campos obrigatórios

## Blocked by

Nada — pode começar imediatamente
