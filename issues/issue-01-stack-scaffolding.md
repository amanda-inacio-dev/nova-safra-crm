# Issue #01 — Decisão de stack e scaffolding do projeto

**Tipo:** HITL  
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Configurar o repositório e estrutura base do projeto com a stack definida:

- **Frontend + Backend:** Next.js (App Router) hospedado na Vercel
- **Banco de dados + Auth + Storage:** Supabase
- **E-mail transacional:** Resend
- **Pagamentos:** Stripe

Criar a estrutura de pastas, variáveis de ambiente, conexões com serviços externos e deploy inicial vazio na Vercel.

## Acceptance criteria

- [ ] Repositório criado no GitHub com `.gitignore` adequado
- [ ] Next.js inicializado com App Router e TypeScript
- [ ] Supabase project criado e conectado (variáveis de ambiente configuradas)
- [ ] Cliente Supabase disponível no projeto
- [ ] Resend configurado com domínio de envio verificado
- [ ] Stripe configurado com chaves de teste
- [ ] Deploy na Vercel funcionando (página inicial em branco)
- [ ] Variáveis de ambiente documentadas no `.env.example`
- [ ] `setup-pre-commit` executado (Prettier + type-check)

## Blocked by

Nenhuma — pode iniciar imediatamente.

## Configuração manual necessária (passo a passo)

### Supabase

1. Acesse https://supabase.com e crie uma conta
2. Clique em "New project", dê um nome (ex: `nova-safra-crm`), escolha a região mais próxima (South America) e defina uma senha forte para o banco
3. Aguarde o projeto inicializar (~2 min)
4. Em "Project Settings > API", copie: `Project URL` e `anon public key`
5. Guarde também a `service_role key` (nunca expor no frontend)

### Vercel

1. Acesse https://vercel.com e conecte com sua conta GitHub
2. Importe o repositório do projeto
3. Em "Environment Variables", adicione todas as variáveis do `.env.example`
4. Clique em "Deploy"

### Resend

1. Acesse https://resend.com e crie uma conta
2. Em "Domains", adicione e verifique o domínio de e-mail da Nova Safra
3. Em "API Keys", crie uma chave e guarde

### Stripe

1. Acesse https://stripe.com e crie uma conta
2. No dashboard, copie as chaves `Publishable key` e `Secret key` do modo teste
3. Adicione nas variáveis de ambiente
