import type { AdditionalInputType } from '@/app/(dashboard)/admin/configuracoes/additionals-actions'

export type ClientOption = { id: string; name: string }
export type PortOption = { id: string; name: string }
export type CertOption = { id: string; name: string; image_url: string | null }
/** Sugestão salva (Remetente/Destinatário/Origem/Destino) — não trava o campo, só sugere. */
export type NameOption = { id: string; name: string }
export type AdditionalOption = {
  id: string
  name: string
  input_type: AdditionalInputType
  has_unit_basis: boolean
  subtypes: { id: string; name: string }[]
  /** Textos prontos para a observação (ex.: "15 dias"), cadastrados no Admin. */
  presets: string[]
}

/** Base do valor de um adicional (ex.: Estadia). */
export type UnitBasis = 'POR_VEICULO' | 'POR_CONTAINER'

export const UNIT_BASIS_LABEL: Record<UnitBasis, string> = {
  POR_VEICULO: 'Por veículo',
  POR_CONTAINER: 'Por container',
}

/** Converte texto de valor (aceita vírgula) em número. */
export const toNumber = (s: string): number => Number(String(s).replace(',', '.')) || 0

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
