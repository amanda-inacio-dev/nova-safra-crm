'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { QuotationAdditionalInput } from '../actions'
import { type AdditionalOption, toNumber, brl } from './types'

type Entry = {
  included: boolean
  value: string
  observation: string
  subtypes: Record<string, { checked: boolean; value: string }>
}

const emptyEntry = (): Entry => ({ included: false, value: '', observation: '', subtypes: {} })

type State = Record<string, Entry>

function derive(
  additionals: AdditionalOption[],
  state: State
): { selections: QuotationAdditionalInput[]; subtotal: number } {
  const selections: QuotationAdditionalInput[] = []
  let subtotal = 0

  for (const a of additionals) {
    const e = state[a.id]
    if (!e?.included) continue

    if (a.input_type === 'VALUE') {
      const v = toNumber(e.value)
      selections.push({ additionalId: a.id, value: v })
      subtotal += v
    } else if (a.input_type === 'OBSERVATION') {
      selections.push({ additionalId: a.id, observation: e.observation })
    } else {
      for (const st of a.subtypes) {
        const sub = e.subtypes[st.id]
        if (sub?.checked) {
          const v = toNumber(sub.value)
          selections.push({ additionalId: a.id, subtypeId: st.id, value: v })
          subtotal += v
        }
      }
    }
  }

  return { selections, subtotal }
}

export function AdditionalsSelector({
  additionals,
  onChange,
}: {
  additionals: AdditionalOption[]
  onChange: (selections: QuotationAdditionalInput[], subtotal: number) => void
}) {
  const [state, setState] = useState<State>({})

  function commit(next: State) {
    setState(next)
    const { selections, subtotal } = derive(additionals, next)
    onChange(selections, subtotal)
  }

  function setEntry(id: string, patch: Partial<Entry>) {
    const current = state[id] ?? emptyEntry()
    commit({ ...state, [id]: { ...current, ...patch } })
  }

  function setSubtype(
    addId: string,
    stId: string,
    patch: Partial<{ checked: boolean; value: string }>
  ) {
    const current = state[addId] ?? emptyEntry()
    const sub = current.subtypes[stId] ?? { checked: false, value: '' }
    commit({
      ...state,
      [addId]: { ...current, subtypes: { ...current.subtypes, [stId]: { ...sub, ...patch } } },
    })
  }

  const subtotal = derive(additionals, state).subtotal

  if (additionals.length === 0) {
    return <p className="text-sm text-slate-400">Nenhum adicional cadastrado.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {additionals.map((a) => {
        const e = state[a.id] ?? emptyEntry()
        return (
          <div key={a.id} className="rounded-md border border-slate-200 p-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={e.included}
                onChange={(ev) => setEntry(a.id, { included: ev.target.checked })}
              />
              <span className="text-sm font-medium text-slate-800">{a.name}</span>
            </label>

            {e.included && a.input_type === 'VALUE' && (
              <div className="mt-2 w-40">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={e.value}
                  onChange={(ev) => setEntry(a.id, { value: ev.target.value })}
                  placeholder="Valor (R$)"
                />
              </div>
            )}

            {e.included && a.input_type === 'OBSERVATION' && (
              <div className="mt-2">
                <Textarea
                  rows={2}
                  value={e.observation}
                  onChange={(ev) => setEntry(a.id, { observation: ev.target.value })}
                  placeholder="Observação"
                />
              </div>
            )}

            {e.included && a.input_type === 'SUBTYPES' && (
              <div className="mt-2 flex flex-col gap-2 pl-6">
                {a.subtypes.map((st) => {
                  const sub = e.subtypes[st.id] ?? { checked: false, value: '' }
                  return (
                    <div key={st.id} className="flex items-center gap-2">
                      <label className="flex min-w-56 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sub.checked}
                          onChange={(ev) => setSubtype(a.id, st.id, { checked: ev.target.checked })}
                        />
                        <span className="text-sm text-slate-700">{st.name}</span>
                      </label>
                      {sub.checked && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={sub.value}
                          onChange={(ev) => setSubtype(a.id, st.id, { value: ev.target.value })}
                          placeholder="Valor (R$)"
                          className="h-9 w-36"
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

      <p className="text-right text-sm font-medium text-slate-700">
        Total dos adicionais: {brl(subtotal)}
      </p>
    </div>
  )
}
