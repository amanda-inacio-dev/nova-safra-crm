# Issue #15 — Infraestrutura de textos padrão de e-mail configuráveis

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Criar uma infraestrutura reutilizável de "templates de e-mail" configuráveis, para ser consumida pelas issues #17 (solicitação de retorno ao cliente), #22 (envio de prospecções) e #25 (aniversariantes). Hoje `app_settings` (migration `0005_admin_config.sql`) é uma tabela singleton só com `company_name`/`logo_url` — não existe nenhum campo de texto padrão de e-mail.

Criar uma tabela `email_templates` (chave, assunto, corpo, imagem opcional) com um registro por finalidade, numa aba própria no menu Admin — `/admin/textos-padrao` — separada de `/admin/configuracoes` (pedido explícito da usuária: não misturar com as configurações da cotação), reaproveitando o padrão visual dos managers existentes (ex.: `certifications-manager.tsx` para upload de imagem).

## Acceptance criteria

- [x] Migration: tabela `email_templates` (`id, key, subject, body, image_url, updated_at`), RLS restrita a `ADMIN` para escrita, leitura liberada para uso interno das server actions
- [x] Seed inicial com as chaves conhecidas: `client_followup_request`, `prospection_industria`, `prospection_cafe`, `birthday_message` (texto padrão de fábrica em cada uma)
- [x] Aba própria "Textos Padrão" (`/admin/textos-padrao`, item de menu só para ADMIN), no mesmo padrão visual dos managers existentes
- [x] Cada template editável: assunto, corpo (texto livre, com quebras de linha), e imagem opcional (upload para Supabase Storage)
- [x] Função utilitária `getEmailTemplate(key)` para ser consumida pelas issues #17, #22 e #25
- [x] Testes: fallback para o texto padrão de fábrica quando não há customização salva pelo admin

## Blocked by

Nada — pode começar imediatamente
