import type { AdditionalInputType } from '@/app/(dashboard)/admin/configuracoes/additionals-actions'

export type ClientOption = { id: string; name: string }
export type PortOption = { id: string; name: string }
export type CertOption = { id: string; name: string; image_url: string | null }
export type AdditionalOption = {
  id: string
  name: string
  input_type: AdditionalInputType
  subtypes: { id: string; name: string }[]
}

/** Converte texto de valor (aceita vírgula) em número. */
export const toNumber = (s: string): number => Number(String(s).replace(',', '.')) || 0

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
