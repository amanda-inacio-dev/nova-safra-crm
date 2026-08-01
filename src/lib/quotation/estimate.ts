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

/** Valor dos impostos suspensos = Mercadoria × alíquota% (0 quando não DTA). */
export function suspendedTaxesAmount(merchandiseValue: number, ratePercent: number): number {
  return round2(((Number(merchandiseValue) || 0) * (Number(ratePercent) || 0)) / 100)
}

/** Valor da mercadoria usado no seguro = Mercadoria + impostos suspensos. */
export function insuranceMerchandiseValue(
  merchandiseValue: number,
  suspendedTaxesRate: number
): number {
  return round2(
    (Number(merchandiseValue) || 0) + suspendedTaxesAmount(merchandiseValue, suspendedTaxesRate)
  )
}

/**
 * Valor do seguro.
 *   Mercadoria p/ seguro = Mercadoria + (Mercadoria × Impostos Suspensos%)
 *   Seguro = (Mercadoria p/ seguro + Base do Contêiner) × Taxa%
 * Impostos suspensos só entram quando a operação é DTA (o chamador passa 0
 * quando não se aplica).
 */
export function calculateInsurance(params: {
  merchandiseValue: number
  suspendedTaxesRate: number
  containerBase: number
  ratePercent: number
}): number {
  const merch = insuranceMerchandiseValue(params.merchandiseValue, params.suspendedTaxesRate)
  const base = merch + (Number(params.containerBase) || 0)
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
