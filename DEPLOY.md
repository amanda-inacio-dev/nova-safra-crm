# Como colocar o sistema no ar (GitHub + Vercel)

Guia passo a passo. Faça na ordem — cada passo depende do anterior.

> **Importante:** o sistema publicado vai usar **o mesmo banco Supabase** que você
> já usa hoje. Não existe um "banco de teste" separado: o que for criado no ar
> aparece aqui e vice-versa.

---

## Passo 1 — Criar o repositório no GitHub

1. Entre em **https://github.com/new** (crie uma conta gratuita se ainda não tiver).
2. **Repository name:** `nova-safra-crm`
3. **Visibility:** marque **Private** (o código fica só seu).
4. **NÃO** marque nenhuma das caixinhas de "Initialize this repository with"
   (README, .gitignore, license) — o repositório precisa nascer vazio.
5. Clique em **Create repository**.
6. Copie o endereço que aparece, no formato:
   `https://github.com/SEU_USUARIO/nova-safra-crm.git`

## Passo 2 — Enviar o código

No terminal, dentro da pasta do projeto:

```bash
git remote add origin https://github.com/SEU_USUARIO/nova-safra-crm.git
git push -u origin master
```

Na primeira vez, vai abrir uma janela do navegador pedindo login no GitHub —
autorize. Depois disso o computador guarda o acesso e não pergunta mais.

## Passo 3 — Importar na Vercel

1. Entre em **https://vercel.com** e clique em **Sign Up** → **Continue with GitHub**
   (usar a conta do GitHub evita configurar acesso depois).
2. **Add New...** → **Project**.
3. Encontre `nova-safra-crm` na lista e clique em **Import**.
4. A Vercel reconhece sozinha que é Next.js — **não mexa** em Build Command,
   Output Directory nem Install Command.
5. **Antes de clicar em Deploy**, abra **Environment Variables** e cadastre as
   variáveis do passo 4.

## Passo 4 — Variáveis de ambiente

Copie os valores do seu arquivo `.env.local` (ele nunca vai pro GitHub, por isso
precisa ser cadastrado à mão aqui). Marque as três opções de ambiente
(Production, Preview, Development) em cada uma.

| Variável                          | Obrigatória | Observação                                                                                        |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Sim         | Mesmo valor do `.env.local`                                                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Sim         | Mesmo valor do `.env.local`                                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`       | Sim         | **Segredo** — dá acesso total ao banco, nunca mostre                                              |
| `RESEND_API_KEY`                  | Sim         | Sem ela os e-mails não saem (o link ainda é gerado)                                               |
| `RESEND_FROM_EMAIL`               | Sim         | Hoje `onboarding@resend.dev`                                                                      |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Sim         | Autocompletar de endereços                                                                        |
| `NEXT_PUBLIC_APP_URL`             | Sim         | Ver passo 6 — só dá pra preencher depois do 1º deploy                                             |
| `PUPPETEER_SKIP_DOWNLOAD`         | Sim         | Valor: `true`. Evita baixar um Chrome inteiro (~150 MB) a cada build, que não é usado no servidor |

Não precisa cadastrar as variáveis do **Stripe**: o arquivo que as usaria
(`src/lib/stripe/client.ts`) veio do esqueleto inicial e não é usado por
nenhuma tela hoje.

## Passo 5 — Publicar

Clique em **Deploy** e espere (uns 2 a 4 minutos na primeira vez). No fim a
Vercel mostra o endereço, algo como `https://nova-safra-crm.vercel.app`.

## Passo 6 — Ajustar o endereço e publicar de novo

O sistema precisa saber o próprio endereço para montar os links dos e-mails, o
link do portal do cliente e as imagens do PDF.

1. Na Vercel: **Settings** → **Environment Variables** → edite `NEXT_PUBLIC_APP_URL`
   e coloque o endereço do passo 5, **sem barra no fim**
   (ex.: `https://nova-safra-crm.vercel.app`).
2. Vá em **Deployments** → nos três pontinhos da última publicação → **Redeploy**.

Sem isso, os e-mails chegam com links apontando para `localhost` e a logo some do PDF.

## Passo 7 — Liberar o endereço no Supabase

O login usa links por e-mail (confirmação e redefinição de senha), e o Supabase
só aceita redirecionar para endereços autorizados.

1. Supabase → seu projeto → **Authentication** → **URL Configuration**.
2. **Site URL:** o endereço da Vercel.
3. **Redirect URLs:** adicione `https://SEU-ENDERECO.vercel.app/**`
   (mantenha também `http://localhost:3000/**` para continuar desenvolvendo).

## Passo 8 — E-mails de verdade (opcional, quando quiser)

Hoje o Resend está com o domínio de teste: **só envia para o e-mail dono da
conta Resend**. Para enviar aos clientes de verdade, verifique o domínio da
Nova Safra em resend.com → Domains, e troque `RESEND_FROM_EMAIL` para algo como
`cotacoes@novasafralog.com.br`.

## Passo 9 — Testar no ar

Depois do redeploy do passo 6, confira nesta ordem:

1. Entrar com seu login de admin.
2. Abrir o Dashboard e a lista de Cotações.
3. Abrir uma cotação → **Gerar PDF** (é o passo mais pesado; a primeira vez
   pode demorar ~15 s porque o servidor precisa "acordar" o Chrome).
4. **Enviar por e-mail** e abrir o link do portal do cliente.

---

## Depois: como publicar uma mudança

Com o GitHub conectado, é automático — todo `git push` publica sozinho:

```bash
git add -A
git commit -m "descricao da mudanca"
git push
```

A Vercel avisa por e-mail quando termina.

## Detalhes técnicos (para consulta)

- **Migrations:** o Supabase **não** é atualizado pelo deploy. Todo arquivo novo
  em `supabase/migrations/` continua sendo aplicado à mão no SQL Editor.
  Aplicadas até a **0026**.
- **PDF:** em produção usa `puppeteer-core` + `@sparticuz/chromium` (Chrome
  enxuto para servidor); no seu computador usa o `puppeteer` completo. A troca é
  automática (`src/lib/pdf/generate.ts`).
- **Tempo limite:** a tela de revisão declara `maxDuration = 60`, teto do plano
  gratuito da Vercel, porque gerar PDF passa dos 10 s padrão numa execução fria.
- **Segredos:** `.env.local` está no `.gitignore` e nunca vai para o GitHub.
