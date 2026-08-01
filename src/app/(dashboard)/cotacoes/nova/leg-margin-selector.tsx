'use client'

import { useState } from 'react'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Textarea } from '@/components/ui/textarea'
import { normalizeName } from '@/lib/quotation/estimate'
import type { QuotationAdditionalInput } from '../actions'
import { type AdditionalOption, toNumber } from './types'

/** As 3 "margens esquerda" — únicos adicionais que passam a ser lançados por trecho. */
const MARGIN_NAMES = [
  'Retirada margem esquerda',
  'Entrega margem esquerda',
  'Retirada e entrega margem esquerda',
]

export function isMarginAdditional(name: string): boolean {
  return MARGIN_NAMES.some((n) => normalizeName(n) === normalizeName(name))
}

/** Ordem fixa dos subtipos dentro de cada margem esquerda: Frete sempre antes do Pedágio. */
const SUBTYPE_PRIORITY: Record<string, number> = { frete: 0, pedagio: 1 }

function sortedSubtypes<T extends { name: string }>(subtypes: T[]): T[] {
  return [...subtypes].sort(
    (a, b) =>
      (SUBTYPE_PRIORITY[normalizeName(a.name)] ?? 99) -
      (SUBTYPE_PRIORITY[normalizeName(b.name)] ?? 99)
  )
}

type SubtypeState = { checked: boolean; value: string; observation: string }
type Entry = { included: boolean; subtypes: Record<string, SubtypeState> }
type State = Record<string, Entry>

const emptyEntry = (): Entry => ({ included: false, subtypes: {} })
const emptySub = (): SubtypeState => ({ checked: false, value: '', observation: '' })

function buildInitial(initial: QuotationAdditionalInput[]): State {
  const state: State = {}
  for (const sel of initial) {
    if (!sel.additionalId || !sel.subtypeId) continue
    const current = state[sel.additionalId] ?? emptyEntry()
    state[sel.additionalId] = {
      included: true,
      subtypes: {
        ...current.subtypes,
        [sel.subtypeId]: {
          checked: true,
          value: sel.value != null ? String(sel.value) : '',
          observation: sel.observation ?? '',
        },
      },
    }
  }
  return state
}

function derive(additionals: AdditionalOption[], state: State): QuotationAdditionalInput[] {
  const selections: QuotationAdditionalInput[] = []
  for (const a of additionals) {
    const e = state[a.id]
    if (!e?.included) continue
    for (const st of sortedSubtypes(a.subtypes)) {
      const sub = e.subtypes[st.id]
      if (sub?.checked) {
        selections.push({
          additionalId: a.id,
          subtypeId: st.id,
          value: toNumber(sub.value),
          observation: sub.observation.trim() || null,
        })
      }
    }
  }
  return selections
}

/** Seletor das 3 margens esquerda (Frete/Pedágio por subtipo), escopado a UM trecho. */
export function LegMarginSelector({
  additionals,
  initial,
  onChange,
}: {
  /** Catálogo completo — o componente filtra só as margens esquerda. */
  additionals: AdditionalOption[]
  initial?: QuotationAdditionalInput[]
  onChange: (selections: QuotationAdditionalInput[]) => void
}) {
  const marginAdditionals = additionals.filter((a) => isMarginAdditional(a.name))
  const [state, setState] = useState<State>(() => buildInitial(initial ?? []))

  function commit(next: State) {
    setState(next)
    onChange(derive(marginAdditionals, next))
  }

  function setEntry(id: string, patch: Partial<Entry>) {
    const current = state[id] ?? emptyEntry()
    commit({ ...state, [id]: { ...current, ...patch } })
  }

  function setSubtype(addId: string, stId: string, patch: Partial<SubtypeState>) {
    const current = state[addId] ?? emptyEntry()
    const sub = current.subtypes[stId] ?? emptySub()
    commit({
      ...state,
      [addId]: { ...current, subtypes: { ...current.subtypes, [stId]: { ...sub, ...patch } } },
    })
  }

  if (marginAdditionals.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {marginAdditionals.map((a) => {
        const e = state[a.id] ?? emptyEntry()
        return (
          <div key={a.id} className="rounded-md border border-slate-200 p-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={e.included}
                onChange={(ev) => setEntry(a.id, { included: ev.target.checked })}
              />
              <span className="text-sm text-slate-700">{a.name}</span>
            </label>
            {e.included && (
              <div className="mt-2 flex flex-col gap-2 pl-6">
                {sortedSubtypes(a.subtypes).map((st) => {
                  const sub = e.subtypes[st.id] ?? emptySub()
                  return (
                    <div key={st.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <label className="flex min-w-32 cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sub.checked}
                            onChange={(ev) =>
                              setSubtype(a.id, st.id, { checked: ev.target.checked })
                            }
                          />
                          <span className="text-sm text-slate-700">{st.name}</span>
                        </label>
                        {sub.checked && (
                          <CurrencyInput
                            value={sub.value}
                            onValueChange={(v) => setSubtype(a.id, st.id, { value: v })}
                            placeholder="R$ 0,00"
                            className="h-9 w-32"
                          />
                        )}
                      </div>
                      {sub.checked && (
                        <Textarea
                          rows={1}
                          value={sub.observation}
                          onChange={(ev) =>
                            setSubtype(a.id, st.id, { observation: ev.target.value })
                          }
                          placeholder="Observação (opcional)"
                          className="ml-6"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
