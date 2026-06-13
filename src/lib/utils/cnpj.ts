/** Remove tudo que não é dígito. */
function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Valida um CNPJ pelos dígitos verificadores (algoritmo oficial).
 * Aceita com ou sem máscara. Rejeita sequências repetidas (ex.: 000…).
 */
export function validateCnpj(value: string): boolean {
  const cnpj = onlyDigits(value)
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  const calcCheckDigit = (length: number): number => {
    let sum = 0
    let weight = length - 7
    for (let i = 0; i < length; i++) {
      sum += Number(cnpj[i]) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const firstDigit = calcCheckDigit(12)
  if (firstDigit !== Number(cnpj[12])) return false

  const secondDigit = calcCheckDigit(13)
  return secondDigit === Number(cnpj[13])
}

/** Aplica a máscara 00.000.000/0000-00 progressivamente. */
export function formatCnpj(value: string): string {
  const cnpj = onlyDigits(value).slice(0, 14)
  return cnpj
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
