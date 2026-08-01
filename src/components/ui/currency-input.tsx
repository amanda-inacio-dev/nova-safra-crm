'use client'

import { useState } from 'react'
import { Input } from './input'

/** Converte texto digitado (pt-BR) em número. Remove milhar (.) e usa vírgula como decimal. */
function parseCurrency(str: string): number {
  const clean = str
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const n = Number(clean)
  return Number.isFinite(n) ? n : 0
}

function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Casas decimais (centavos) aceitas após a vírgula. */
const MAX_DECIMALS = 2

/**
 * Converte o valor canônico do formulário (ex.: "20000.26", ponto = decimal)
 * para o buffer interno digitado (dígitos + vírgula). Usa `Number()` direto —
 * NUNCA `parseCurrency` — porque `parseCurrency` trata todo ponto como
 * separador de milhar; aplicado a um valor que já tem ponto decimal, ele
 * apagaria a vírgula/centavos e infla o número 100x (ex.: 20000.26 -> 2000026).
 */
export function toRaw(value: string): string {
  if (!value) return ''
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const rounded = Math.round(n * 100) / 100
  return String(rounded).replace('.', ',')
}

/**
 * Acrescenta caracteres digitados/colados ao buffer bruto: dígitos sempre são
 * aceitos (viram reais inteiros até aparecer uma vírgula; depois dela, viram
 * centavos, no máximo 2 casas); vírgula/ponto vira a vírgula decimal (só uma);
 * qualquer outro caractere é ignorado.
 */
export function appendToRaw(raw: string, insert: string): string {
  let r = raw
  for (const ch of insert) {
    if (ch >= '0' && ch <= '9') {
      const commaIdx = r.indexOf(',')
      if (commaIdx === -1 || r.length - commaIdx - 1 < MAX_DECIMALS) {
        r += ch
      }
    } else if ((ch === ',' || ch === '.') && !r.includes(',')) {
      r += ','
    }
  }
  return r
}

/**
 * Remove do final do buffer bruto a mesma quantidade de caracteres que o
 * usuário apagou no texto exibido (Backspace/Delete/seleção+apagar).
 *
 * Não dá para "encolher até caber" reformatando a cada tentativa: como o
 * texto formatado sempre mostra 2 casas decimais, buffers diferentes (ex.:
 * "650,26", "650,2", "650," e "650") formatam para textos de tamanho igual
 * ou muito parecido — um único Backspace apagaria vários dígitos de uma vez
 * se a lógica só tentasse "caber no novo tamanho". Por isso removemos do
 * buffer exatamente a quantidade de caracteres que sumiu do texto exibido.
 */
export function shrinkByDeleteCount(raw: string, deleteCount: number): string {
  return raw.slice(0, Math.max(0, raw.length - deleteCount))
}

type CurrencyInputProps = {
  /** Valor numérico como string (ponto decimal), ex.: "20000" ou "20000.5". */
  value: string
  /** Recebe o valor limpo (string numérica ou '' quando vazio). */
  onValueChange: (value: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

/**
 * Campo de valor em reais. Formata como "R$ 20.000,00" em tempo real, durante
 * a digitação. Dígitos sem vírgula são sempre reais inteiros (ex.: "20000"
 * -> R$ 20.000,00, nunca R$ 200,00); a vírgula é opcional e abre espaço para
 * até 2 casas de centavos.
 *
 * O campo se comporta como um visor de calculadora: dígitos sempre são
 * acrescentados ao final do valor e Backspace sempre remove o último
 * caractere digitado — não é possível clicar no meio do valor formatado para
 * inserir um dígito (o React recompõe o texto exibido a cada tecla e a
 * posição do cursor é mantida no final pelo próprio navegador). Colar texto
 * (ou selecionar tudo e digitar por cima) substitui o buffer inteiro.
 */
export function CurrencyInput({ value, onValueChange, ...props }: CurrencyInputProps) {
  const [raw, setRaw] = useState(() => toRaw(value))
  const [lastValue, setLastValue] = useState(value)

  // Resincroniza o buffer quando `value` muda por um motivo EXTERNO (ex.:
  // legs-editor.tsx reaproveita a mesma instância de campo ao remover um
  // trecho do meio da lista, pois usa o índice como key) — não quando é o
  // próprio componente ecoando de volta o valor que acabou de emitir.
  if (value !== lastValue) {
    setLastValue(value)
    setRaw(toRaw(value))
  }

  const display = raw ? formatBRL(parseCurrency(raw)) : ''

  function commit(nextRaw: string) {
    const numStr = nextRaw === '' ? '' : String(parseCurrency(nextRaw))
    setRaw(nextRaw)
    setLastValue(numStr)
    onValueChange(numStr)
  }

  function commitFromNative(native: string) {
    let nextRaw: string
    if (native === '') {
      nextRaw = ''
    } else if (native.length > display.length && native.startsWith(display)) {
      nextRaw = appendToRaw(raw, native.slice(display.length))
    } else if (native.length < display.length && display.startsWith(native)) {
      nextRaw = shrinkByDeleteCount(raw, display.length - native.length)
    } else {
      // Substituição total (colar, autofill, selecionar tudo e digitar por
      // cima): interpreta o texto inteiro do zero com as mesmas regras.
      nextRaw = appendToRaw('', native)
    }
    commit(nextRaw)
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => commitFromNative(e.target.value)}
    />
  )
}
