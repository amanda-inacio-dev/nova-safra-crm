import type { QuotationAdditionalInput } from '../actions'

export type LegGroup = 'DTA' | 'DI' | ''

export type LegRow = {
  origin: string
  destination: string
  freightValue: string
  freightIncluded: boolean
  tollValue: string
  tollIncluded: boolean
  /** Alíquota de ICMS deste trecho (%) — cada trecho aplica a sua sobre a própria soma. */
  icmsRate: string
  /** Só usado quando a operação é DTA+DI, pra saber em qual bloco o trecho aparece. */
  legGroup: LegGroup
  /** Margens esquerda (Retirada/Entrega/Retirada e entrega) lançadas neste trecho. */
  additionals: QuotationAdditionalInput[]
}

/** Trecho em branco — precisa ser chamável tanto de componentes de cliente
 *  (novo trecho no editor) quanto de Server Components (montar o estado
 *  inicial de uma cotação sem nenhum trecho salvo). Por isso mora num módulo
 *  sem 'use client': uma função exportada de um arquivo de cliente não pode
 *  ser invocada do servidor (só componentes/props podem atravessar a borda). */
export const emptyLeg = (legGroup: LegGroup = ''): LegRow => ({
  origin: '',
  destination: '',
  freightValue: '',
  freightIncluded: true,
  tollValue: '',
  tollIncluded: true,
  icmsRate: '',
  legGroup,
  additionals: [],
})
