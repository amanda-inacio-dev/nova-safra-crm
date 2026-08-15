# Issue #25 — Módulo de Aniversariantes

**Tipo:** AFK
**Bloqueada por:** Issue #15

## What to build

Nova aba "Aniversariantes" para cadastrar cliente + nome do aniversariante + data. Rotina diária (Vercel Cron) que verifica aniversários do dia e gera um alerta in-app "Hoje é aniversário de X" com a opção de enviar ou não os parabéns (texto padrão + imagem, configurável via issue #15, editável no momento do envio — mesmo padrão da issue #17).

Quando o aniversário cai em fim de semana ou feriado, o sistema deve alertar um dia antes, com a opção de adiantar o envio ou não (feriados nacionais brasileiros, fixos e móveis).

## Acceptance criteria

- [ ] Migration: tabela `birthdays` (`id, client_id, person_name, birth_date, created_at`)
- [ ] Aba "Aniversariantes" com CRUD (cliente, nome, data)
- [ ] Rotina diária (cron) que identifica aniversários do dia e gera notificação in-app "Hoje é aniversário de X", com ação de enviar/não enviar parabéns
- [ ] Envio usa o template `birthday_message` (texto + imagem, issue #15), editável antes de confirmar
- [ ] Lógica de feriados/fins de semana: se o aniversário cair em sábado, domingo ou feriado nacional, gerar o alerta um dia útil antes com a opção de adiantar ou aguardar a data real
- [ ] Fonte de feriados nacionais (tabela própria ou biblioteca), considerando feriados fixos e móveis (ex.: Carnaval, Páscoa)
- [ ] Testes: detecção de aniversário em fim de semana/feriado e cálculo do dia de antecipação

## Blocked by

Issue #15
