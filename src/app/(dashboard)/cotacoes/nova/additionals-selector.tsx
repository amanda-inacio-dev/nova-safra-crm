'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import type { QuotationAdditionalInput } from '../actions'
import { type AdditionalOption, type UnitBasis, UNIT_BASIS_LABEL, toNumber } from './types'

type Entry = {
  included: boolean
  value: string // VALUE: valor em R$ | PERCENT: alíquota %
  observation: string
  unitBasis: UnitBasis | ''
  subtypes: Record<string, { checked: boolean; value: string }>
}

const emptyEntry = (): Entry => ({
  included: false,
  value: '',
  observation: '',
  unitBasis: '',
  subtypes: {},
})

type ManualRow = { id: string; name: string; value: string; observation: string }

const emptyManual = (): ManualRow => ({
  id: crypto.randomUUID(),
  name: '',
  value: '',
  observation: '',
})

type State = Record<string, Entry>

function derive(
  additionals: AdditionalOption[],
  state: State,
  manuals: ManualRow[]
): QuotationAdditionalInput[] {
  const selections: QuotationAdditionalInput[] = []

  for (const a of additionals) {
    const e = state[a.id]
    if (!e?.included) continue
    const observation = e.observation.trim() || null

    if (a.input_type === 'VALUE') {
      selections.push({ additionalId: a.id, value: toNumber(e.value), observation })
    } else if (a.input_type === 'PERCENT') {
      selections.push({ additionalId: a.id, percent: toNumber(e.value), value: null, observation })
    } else if (a.input_type === 'OBSERVATION') {
      selections.push({ additionalId: a.id, observation })
    } else {
      // SUBTYPES
      const unitBasis = a.has_unit_basis ? e.unitBasis || null : null
      let pushed = false
      for (const st of a.subtypes) {
        const sub = e.subtypes[st.id]
        if (sub?.checked) {
          selections.push({
            additionalId: a.id,
            subtypeId: st.id,
            value: toNumber(sub.value),
            unitBasis,
            observation,
          })
          pushed = true
        }
      }
      // Nenhum subtipo marcado, mas há observação: registra o adicional mesmo assim.
      if (!pushed && observation) {
        selections.push({ additionalId: a.id, unitBasis, observation })
      }
    }
  }

  for (const m of manuals) {
    if (!m.name.trim()) continue
    selections.push({
      customName: m.name.trim(),
      value: toNumber(m.value),
      observation: m.observation.trim() || null,
    })
  }

  return selections
}

export function AdditionalsSelector({
  additionals,
  onChange,
}: {
  additionals: AdditionalOption[]
  onChange: (selections: QuotationAdditionalInput[]) => void
}) {
  const [state, setState] = useState<State>({})
  const [manuals, setManuals] = useState<ManualRow[]>([])

  function emit(nextState: State, nextManuals: ManualRow[]) {
    onChange(derive(additionals, nextState, nextManuals))
  }

  function setEntry(id: string, patch: Partial<Entry>) {
    const current = state[id] ?? emptyEntry()
    const next = { ...state, [id]: { ...current, ...patch } }
    setState(next)
    emit(next, manuals)
  }

  function setSubtype(
    addId: string,
    stId: string,
    patch: Partial<{ checked: boolean; value: string }>
  ) {
    const current = state[addId] ?? emptyEntry()
    const sub = current.subtypes[stId] ?? { checked: false, value: '' }
    const next = {
      ...state,
      [addId]: { ...current, subtypes: { ...current.subtypes, [stId]: { ...sub, ...patch } } },
    }
    setState(next)
    emit(next, manuals)
  }

  function setManualRow(id: string, patch: Partial<ManualRow>) {
    const next = manuals.map((m) => (m.id === id ? { ...m, ...patch } : m))
    setManuals(next)
    emit(state, next)
  }

  function addManual() {
    const next = [...manuals, emptyManual()]
    setManuals(next)
    emit(state, next)
  }

  function removeManual(id: string) {
    const next = manuals.filter((m) => m.id !== id)
    setManuals(next)
    emit(state, next)
  }

  return (
    <div className="flex flex-col gap-3">
      {additionals.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum adicional cadastrado.</p>
      ) : (
        additionals.map((a) => {
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

              {e.included && (
                <div className="mt-2 flex flex-col gap-2">
                  {a.input_type === 'VALUE' && (
                    <div className="w-40">
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

                  {a.input_type === 'PERCENT' && (
                    <div className="flex items-center gap-2">
                      <div className="w-28">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={e.value}
                          onChange={(ev) => setEntry(a.id, { value: ev.target.value })}
                          placeholder="Alíquota"
                        />
                      </div>
                      <span className="text-sm text-slate-500">
                        % sobre o total (trechos + adicionais)
                      </span>
                    </div>
                  )}

                  {a.input_type === 'SUBTYPES' && (
                    <>
                      {a.has_unit_basis && (
                        <div className="w-56">
                          <Select
                            value={e.unitBasis}
                            onChange={(ev) =>
                              setEntry(a.id, { unitBasis: ev.target.value as UnitBasis | '' })
                            }
                            aria-label="Valor por"
                          >
                            <option value="">Valor por… (opcional)</option>
                            <option value="POR_VEICULO">{UNIT_BASIS_LABEL.POR_VEICULO}</option>
                            <option value="POR_CONTAINER">{UNIT_BASIS_LABEL.POR_CONTAINER}</option>
                          </Select>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 pl-6">
                        {a.subtypes.map((st) => {
                          const sub = e.subtypes[st.id] ?? { checked: false, value: '' }
                          return (
                            <div key={st.id} className="flex items-center gap-2">
                              <label className="flex min-w-56 cursor-pointer items-center gap-2">
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
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={sub.value}
                                  onChange={(ev) =>
                                    setSubtype(a.id, st.id, { value: ev.target.value })
                                  }
                                  placeholder="Valor (R$)"
                                  className="h-9 w-36"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {/* Observação disponível em todos os adicionais */}
                  <Textarea
                    rows={2}
                    value={e.observation}
                    onChange={(ev) => setEntry(a.id, { observation: ev.target.value })}
                    placeholder={
                      a.input_type === 'OBSERVATION' ? 'Observação' : 'Observação (opcional)'
                    }
                  />
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Adicionais manuais (fora do catálogo) */}
      <div className="rounded-md border border-dashed border-slate-300 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Adicionais manuais</span>
          <button
            type="button"
            onClick={addManual}
            className="text-brand-700 hover:text-brand-800 text-sm font-medium"
          >
            + Adicionar adicional
          </button>
        </div>

        {manuals.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">
            Use para custos que não estão na lista acima.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {manuals.map((m) => (
              <div key={m.id} className="flex flex-col gap-2 rounded-md bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={m.name}
                    onChange={(ev) => setManualRow(m.id, { name: ev.target.value })}
                    placeholder="Nome do adicional"
                    className="h-9 w-64"
                    aria-label="Nome do adicional manual"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={m.value}
                    onChange={(ev) => setManualRow(m.id, { value: ev.target.value })}
                    placeholder="Valor (R$)"
                    className="h-9 w-36"
                    aria-label="Valor do adicional manual"
                  />
                  <button
                    type="button"
                    onClick={() => removeManual(m.id)}
                    className="ml-auto text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
                <Textarea
                  rows={2}
                  value={m.observation}
                  onChange={(ev) => setManualRow(m.id, { observation: ev.target.value })}
                  placeholder="Observação (opcional)"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
