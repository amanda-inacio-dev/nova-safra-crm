import { escapeHtml as esc } from './escape-html'
import type { QuotationPdfData } from './get-quotation-data'

// Este módulo monta HTML por concatenação de strings (não usa JSX/react-dom): o Next.js
// não permite `react-dom/server` em arquivos alcançáveis a partir de uma Server Action
// ("You're importing a component that imports react-dom/server..."), pois conflita com
// o próprio pipeline de Server Components. Por isso todo texto dinâmico passa por `esc()`
// (escapeHtml) manualmente — é o que o React faria sozinho, mas aqui precisa ser explícito.

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
const dateBr = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

/** URL absoluta usada quando a empresa ainda não tem uma logo cadastrada em Admin > Configurações. */
function fallbackCompanyLogoUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}/assets/logo-nova-safra.jpeg`
}

const STYLES = `
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body {
    margin: 0;
    background: #fff;
    color: #1b231d;
    font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  .header { background: #123822; color: #f2f7f3; padding: 20px 32px 16px; }
  .header-top { display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 16px; }
  .header-certs { display: flex; align-items: center; gap: 8px; }
  .header-certs .seal-chip { background: #fff; border-radius: 6px; padding: 3px 6px; display: inline-flex; align-items: center; }
  .header-certs .seal-chip img { display: block; height: 42px; width: auto; }
  .logo-box { background: #fff; border-radius: 6px; padding: 8px 10px; display: inline-flex; align-items: center; justify-self: start; }
  .logo-box img { display: block; height: 40px; width: auto; }
  .masthead { text-align: center; }
  .eyebrow { font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: #bfe0cc; margin: 0 0 2px; }
  .title { font-family: Georgia, 'Iowan Old Style', serif; font-size: 30px; letter-spacing: 0.06em; margin: 0; }
  .code { font-family: Georgia, 'Iowan Old Style', serif; font-size: 13px; color: #cfe8da; margin-top: 4px; }
  .client-slot { justify-self: end; display: flex; align-items: center; justify-content: center; }
  .client-slot img { max-height: 56px; max-width: 120px; display: block; background: #fff; border-radius: 6px; padding: 6px 10px; }
  .meta-strip { background: #e7f1ea; border-bottom: 1px solid #d7e3db; padding: 10px 32px; display: flex; gap: 32px; font-size: 12px; }
  .meta-strip .k { display: block; text-transform: uppercase; letter-spacing: 0.08em; font-size: 9.5px; color: #1f5c39; margin-bottom: 1px; }
  .meta-strip .v { font-weight: 600; }
  .body-pad { padding: 20px 32px 8px; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #1f5c39; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 2px solid #3c8c5c; }
  .kv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 24px; }
  .kv-grid .k { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #5e6b62; margin-bottom: 2px; }
  .kv-grid .v { font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  thead th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #5e6b62; padding: 6px 8px; border-bottom: 1px solid #d7e3db; }
  tbody td { padding: 7px 8px; border-bottom: 1px solid #d7e3db; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.obs { color: #5e6b62; font-size: 11.5px; }
  .totals { margin-top: 4px; margin-left: auto; width: 300px; font-size: 12.5px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .row .l { color: #5e6b62; }
  .totals .row.grand { border-top: 2px solid #3c8c5c; margin-top: 4px; padding-top: 8px; font-size: 15px; font-weight: 700; color: #123822; }
  .totals .row.sum { border-top: 1px solid #d7e3db; margin-top: 4px; padding-top: 8px; }
  .leg-card { border: 1px solid #d7e3db; border-radius: 6px; padding: 10px 12px; margin-bottom: 10px; }
  .leg-card:last-child { margin-bottom: 0; }
  .leg-card .leg-title { font-size: 12.5px; font-weight: 700; color: #123822; margin: 0 0 6px; }
  .leg-card .leg-lines { font-size: 12px; }
  .leg-card .leg-lines .row { display: flex; justify-content: space-between; padding: 2px 0; }
  .leg-card .leg-lines .row .l { color: #5e6b62; }
  .leg-card .leg-lines .row.sub { border-top: 1px solid #e7edea; margin-top: 3px; padding-top: 4px; }
  .leg-card .leg-lines .row.total { font-weight: 700; color: #123822; }
  .footer { border-top: 1px solid #d7e3db; padding: 14px 32px 22px; font-size: 10.5px; color: #5e6b62; display: flex; justify-content: space-between; gap: 12px; }
`

function kvRow(label: string, value: string): string {
  return `<div><div class="k">${esc(label)}</div><div class="v">${esc(value)}</div></div>`
}

function headerCerts(data: QuotationPdfData): string {
  if (data.certifications.length === 0) return ''
  const chips = data.certifications
    .map(
      (c) => `<span class="seal-chip"><img src="${esc(c.imageUrl)}" alt="${esc(c.name)}" /></span>`
    )
    .join('')
  return `<div class="header-certs">${chips}</div>`
}

const LEG_GROUP_LABEL: Record<'DTA' | 'DI', string> = { DTA: 'DTA', DI: 'DI' }

function legCards(data: QuotationPdfData): string {
  return data.legs
    .map((leg, i) => {
      const lineRows = leg.lines
        .map(
          (l) =>
            `<div class="row"><span class="l">${esc(l.label)}</span><span>${brl(l.value)}</span></div>`
        )
        .join('')
      const icmsRow =
        leg.icmsRatePercent > 0
          ? `<div class="row"><span class="l">ICMS (${pct(leg.icmsRatePercent)}%)</span><span>${brl(leg.icmsValue)}</span></div>`
          : ''
      const groupLabel = leg.legGroup ? ` · ${LEG_GROUP_LABEL[leg.legGroup]}` : ''
      return `
        <div class="leg-card">
          <p class="leg-title">Trecho ${i + 1}${esc(groupLabel)}: ${esc(leg.origin || '—')} → ${esc(leg.destination || '—')}</p>
          <div class="leg-lines">
            ${lineRows}
            <div class="row sub"><span class="l">Base do trecho</span><span>${brl(leg.base)}</span></div>
            ${icmsRow}
            <div class="row total"><span class="l">Total do trecho</span><span>${brl(leg.total)}</span></div>
          </div>
        </div>`
    })
    .join('')
}

/** Só os adicionais com informação lançada mas que ficaram FORA da soma do total. */
function additionalsSection(data: QuotationPdfData): string {
  const notApplied = data.additionalLines.filter((a) => !a.includeInTotal)
  if (notApplied.length === 0) return ''
  const rows = notApplied
    .map(
      (a) =>
        `<tr><td>${esc(a.label)}</td><td class="obs">${esc(a.observation || '—')}</td>` +
        `<td class="num">${a.value != null ? brl(a.value) : '—'}</td></tr>`
    )
    .join('')
  return `
    <div class="section">
      <h2>Adicionais (se aplicáveis)</h2>
      <table>
        <thead><tr><th>Descrição</th><th>Observação</th><th class="num">Valor</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

function totalsBlock(data: QuotationPdfData): string {
  // Cada trecho já soma sua própria base + ICMS; aqui só resta somar os trechos (legsTotal)
  // aos adicionais gerais marcados (generalSum, sem ICMS — não pertencem a um trecho).
  const generalRows = data.generalIncludedLines
    .map(
      (l) =>
        `<div class="row"><span class="l">${esc(l.label)}</span><span>${brl(l.value)}</span></div>`
    )
    .join('')

  return `
    <div class="section">
      <h2>Resumo financeiro</h2>
      <div class="totals">
        <div class="row"><span class="l">Soma dos trechos</span><span>${brl(data.legsTotal)}</span></div>
        ${generalRows}
        <div class="row grand"><span class="l">Total Estimado</span><span>${brl(data.grandTotal)}</span></div>
      </div>
    </div>`
}

/** Gera o HTML completo do documento (usado pelo Puppeteer para virar PDF). */
export function renderQuotationHtml(data: QuotationPdfData): string {
  const operationLine = [data.operationType, data.operationSubtypeLabel].filter(Boolean).join(' · ')
  const companyLogo = data.companyLogoUrl ?? fallbackCompanyLogoUrl()

  const extraIdentification = [
    data.emptyContainerPortName ? kvRow('Container vazio', data.emptyContainerPortName) : '',
    data.operationDetailLabel ? kvRow('Detalhe da operação', data.operationDetailLabel) : '',
  ].join('')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${esc(`Proposta ${data.code}`)}</title>
<style>${STYLES}</style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <span class="logo-box"><img src="${esc(companyLogo)}" alt="${esc(data.companyName)}" /></span>
      ${headerCerts(data)}
      <div class="masthead">
        <p class="eyebrow">Transporte Rodoviário Nacional</p>
        <h1 class="title">PROPOSTA</h1>
        <p class="code">${esc(data.code)}</p>
      </div>
      <div class="client-slot">
        ${data.clientLogoUrl ? `<img src="${esc(data.clientLogoUrl)}" alt="${esc(data.clientName)}" />` : ''}
      </div>
    </div>
  </div>

  <div class="meta-strip">
    <div><span class="k">Emitida em</span><span class="v">${dateBr(data.createdAt)}</span></div>
    <div><span class="k">Validade</span><span class="v">${esc(data.validity || '—')}</span></div>
    <div><span class="k">Operação</span><span class="v">${esc(operationLine || '—')}</span></div>
    <div><span class="k">Tipo de valor</span><span class="v">${esc(data.valueType || '—')}</span></div>
  </div>

  <div class="body-pad">
    <div class="section">
      <h2>Identificação</h2>
      <div class="kv-grid">
        ${kvRow('Cliente', data.clientName || '—')}
        ${kvRow('Segmento', data.segment ?? '—')}
        ${kvRow('Produto', data.product ?? '—')}
        ${kvRow('Referência do processo', data.processReference ?? '—')}
        ${kvRow('Remetente', data.sender ?? '—')}
        ${kvRow('Destinatário', data.recipient ?? '—')}
        ${kvRow('Veículo', data.vehicleType || '—')}
        ${extraIdentification}
      </div>
    </div>

    <div class="section">
      <h2>Trechos</h2>
      ${legCards(data)}
    </div>

    ${totalsBlock(data)}
    ${additionalsSection(data)}
  </div>

  <div class="footer">
    <span>Nova Safra Transportes &nbsp;&middot;&nbsp; comercial@novasafralog.com.br</span>
    <span>${esc(data.code)}</span>
  </div>
</body>
</html>`
}
