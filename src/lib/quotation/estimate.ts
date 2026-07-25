/**
 * Cálculos de seguro e total estimado (com ICMS "por dentro").
 * Funções puras, compartilhadas entre o formulário (cliente) e o
 * server action que grava a cotação.
 */

/** Nome do adicional cuja soma vira a "base do contêiner" no seguro. */
export const CONTAINER_INSURANCE_NAME = 'Valor para efeito do contêiner'

/** Normaliza nome para comparação (sem acento, minúsculo). */
export function normalizeName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Arredonda para 2 casas (centavos). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Valor do seguro.
 *   Seguro = (Valor da Mercadoria + Base do Contêiner + Impostos Suspensos) × Taxa%
 * Impostos suspensos só entram quando a operação é DTA (o chamador passa 0
 * quando não se aplica).
 */
export function calculateInsurance(params: {
  merchandiseValue: number
  containerBase: number
  suspendedTaxes: number
  ratePercent: number
}): number {
  const base =
    (Number(params.merchandiseValue) || 0) +
    (Number(params.containerBase) || 0) +
    (Number(params.suspendedTaxes) || 0)
  return round2((base * (Number(params.ratePercent) || 0)) / 100)
}

/**
 * ICMS "por dentro":
 *   Total com ICMS = Soma ÷ (1 − alíquota)
 *   Valor do ICMS  = Total com ICMS × alíquota
 * Quando não há alíquota (0), o total é a própria soma e o ICMS é 0.
 */
export function grossUpWithIcms(
  sum: number,
  icmsRatePercent: number
): { total: number; icmsValue: number } {
  const rate = (Number(icmsRatePercent) || 0) / 100
  if (rate <= 0 || rate >= 1) {
    return { total: round2(sum), icmsValue: 0 }
  }
  const total = round2(sum / (1 - rate))
  const icmsValue = round2(total * rate)
  return { total, icmsValue }
}
