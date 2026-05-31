# Issue #04 — Área administrativa (adicionais, portos, certificações)

**Tipo:** AFK  
**Bloqueada por:** Issue #02

## What to build

Tela administrativa acessível apenas pelo Admin para configurar as listas de domínio usadas no formulário de cotação: adicionais com valores, portos/pátios e banco de logos de certificação.

## Acceptance criteria

- [ ] Tabela `additionals`: id, name, value, active
- [ ] Tabela `ports`: id, name, active
- [ ] Tabela `certifications`: id, name, image_url, active
- [ ] CRUD de adicionais (nome + valor fixo)
- [ ] CRUD de portos e pátios
- [ ] Upload e gerenciamento de logos de certificação no Supabase Storage
- [ ] Configuração de logo principal e nome da empresa
- [ ] Somente Admin acessa esta área

## Blocked by

Issue #02
