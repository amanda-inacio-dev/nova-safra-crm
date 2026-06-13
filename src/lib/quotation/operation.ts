import type { OperationType } from '@/types'

/** Subtipos por tipo de operação. */
export const IMPORT_SUBTYPES = ['DTA', 'DI', 'OUTRO'] as const
export const EXPORT_SUBTYPES = ['DIRETA', 'COM_MAPA'] as const

/** Detalhes do subtipo DTA (Importação). */
export const DTA_DETAILS = ['BAIXA_CONTAINER', 'DESOVA', 'SOBRE_RODAS', 'OUTROS'] as const

export type ImportSubtype = (typeof IMPORT_SUBTYPES)[number]
export type ExportSubtype = (typeof EXPORT_SUBTYPES)[number]

export const OPERATION_LABELS: Record<string, string> = {
  DTA: 'DTA',
  DI: 'DI',
  OUTRO: 'Outro',
  DIRETA: 'Operação direta',
  COM_MAPA: 'Operação com mapa',
  BAIXA_CONTAINER: 'Baixa de container',
  DESOVA: 'Desova de container',
  SOBRE_RODAS: 'Sobre rodas',
  OUTROS: 'Outros',
}

export type OperationSelection = {
  operationType: OperationType | ''
  subtype: string
  detail: string
}

/**
 * Valida a hierarquia de tipo de operação:
 *   Importação > DTA > (Baixa/Desova/Sobre rodas/Outros)
 *   Importação > DI
 *   Importação > Outro (texto livre em detail)
 *   Exportação > Operação direta
 *   Exportação > Operação com mapa > Cidade (texto livre em detail)
 */
export function validateOperation(sel: OperationSelection): { ok: boolean; error?: string } {
  const { operationType, subtype, detail } = sel

  if (operationType === 'IMPORTACAO') {
    if (!IMPORT_SUBTYPES.includes(subtype as ImportSubtype)) {
      return { ok: false, error: 'Selecione o subtipo da importação (DTA, DI ou Outro).' }
    }
    if (subtype === 'DTA' && !DTA_DETAILS.includes(detail as (typeof DTA_DETAILS)[number])) {
      return { ok: false, error: 'Selecione o detalhe da DTA.' }
    }
    if (subtype === 'OUTRO' && !detail.trim()) {
      return { ok: false, error: 'Descreva o tipo de operação (Outro).' }
    }
    return { ok: true }
  }

  if (operationType === 'EXPORTACAO') {
    if (!EXPORT_SUBTYPES.includes(subtype as ExportSubtype)) {
      return { ok: false, error: 'Selecione o tipo de exportação.' }
    }
    if (subtype === 'COM_MAPA' && !detail.trim()) {
      return { ok: false, error: 'Informe a cidade do mapa.' }
    }
    return { ok: true }
  }

  return { ok: false, error: 'Selecione o tipo de operação.' }
}
