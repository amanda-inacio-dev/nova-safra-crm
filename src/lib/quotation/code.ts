import type { OperationType } from '@/types'

/**
 * Formata o código único da cotação a partir do tipo e do número sequencial.
 * Ex.: ('IMPORTACAO', 23) -> 'NS_IMP_0023'; ('EXPORTACAO', 47) -> 'NS_EXP_0047'.
 */
export function formatQuotationCode(operationType: OperationType, n: number): string {
  const prefix = operationType === 'IMPORTACAO' ? 'NS_IMP_' : 'NS_EXP_'
  return `${prefix}${String(n).padStart(4, '0')}`
}
