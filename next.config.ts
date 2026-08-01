import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Puppeteer/Chromium têm binários nativos — não devem ser processados pelo
  // bundler do Next, só carregados diretamente pelo runtime do servidor.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer'],
  // Libera acessar o servidor de dev pelo IP da rede local (ex.: de um notebook
  // na mesma Wi-Fi) — por padrão o Next só permite "localhost" por segurança.
  allowedDevOrigins: ['192.168.15.8'],
}

export default nextConfig
