import type { Browser } from 'puppeteer-core'

const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)

/**
 * Local (Windows/macOS/Linux dev): usa o pacote `puppeteer` completo, que já baixa
 * um Chrome compatível com o sistema operacional do desenvolvedor.
 * Produção (Vercel): usa `puppeteer-core` + `@sparticuz/chromium`, um binário
 * enxuto compatível com o runtime serverless (Linux) — `puppeteer` sozinho é grande
 * demais para empacotar numa função serverless.
 */
async function launchBrowser(): Promise<Browser> {
  if (isProduction) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const puppeteer = await import('puppeteer')
  return puppeteer.launch({ headless: true })
}

/** Renderiza um HTML para PDF (A4, com cores/imagens de fundo) usando um Chrome headless. */
export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
