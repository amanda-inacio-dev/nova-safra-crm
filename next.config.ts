import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Puppeteer/Chromium têm binários nativos — não devem ser processados pelo
  // bundler do Next, só carregados diretamente pelo runtime do servidor.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer'],
  // O @sparticuz/chromium lê os binários do DISCO em tempo de execução
  // (`bin/chromium.br` etc.), não por `import` — então o rastreador de arquivos
  // do Next não tem como enxergá-los e eles ficavam de fora da função na Vercel
  // ("The input directory .../@sparticuz/chromium/bin does not exist" no 1º
  // deploy). Só a rota que gera PDF precisa deles: incluir em todas somaria
  // ~67 MB a cada função à toa.
  // A chave é um padrão glob casado com o caminho da rota — e o caminho real
  // aqui é `/(dashboard)/cotacoes/[id]/revisar`. Não dá pra escrevê-lo literal:
  // `[id]` viraria "um caractere entre i e d" e `(dashboard)` viraria um grupo.
  // `**/revisar` casa a rota inteira sem esbarrar nisso (e só ela termina assim).
  outputFileTracingIncludes: {
    '**/revisar': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  // Libera acessar o servidor de dev pelo IP da rede local (ex.: de um notebook
  // na mesma Wi-Fi) — por padrão o Next só permite "localhost" por segurança.
  allowedDevOrigins: ['192.168.15.8'],
}

export default nextConfig
