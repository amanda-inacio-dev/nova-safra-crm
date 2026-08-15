# Issue #15 — Infraestrutura de textos padrão de e-mail configuráveis

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Criar uma infraestrutura reutilizável de "templates de e-mail" configuráveis, para ser consumida pelas issues #17 (solicitação de retorno ao cliente), #22 (envio de prospecções) e #25 (aniversariantes). Hoje `app_settings` (migration `0005_admin_config.sql`) é uma tabela singleton só com `company_name`/`logo_url` — não existe nenhum campo de texto padrão de e-mail.

Criar uma tabela `email_templates` (chave, assunto, corpo, imagem opcional) com um registro por finalidade, e estender a aba `/admin/configuracoes` com um novo bloco de gerenciamento, reaproveitando o padrão visual dos managers existentes (ex.: `certifications-manager.tsx` para upload de imagem).

## Acceptance criteria

- [ ] Migration: tabela `email_templates` (`id, key, subject, body, image_url, updated_at`), RLS restrita a `ADMIN` para escrita, leitura liberada para uso interno das server actions
- [ ] Seed inicial com as chaves conhecidas: `client_followup_request`, `prospection_industria`, `prospection_cafe`, `birthday_message` (texto padrão de fábrica em cada uma)
- [ ] Bloco "Textos padrão" em `/admin/configuracoes`, no mesmo padrão visual dos managers existentes
- [ ] Cada template editável: assunto, corpo (texto livre, com quebras de linha), e imagem opcional (upload para Supabase Storage)
- [ ] Função utilitária `getEmailTemplate(key)` para ser consumida pelas issues #17, #22 e #25
- [ ] Testes: fallback para o texto padrão de fábrica quando não há customização salva pelo admin

## Blocked by

Nada — pode começar imediatamente
