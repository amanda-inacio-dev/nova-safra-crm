'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import type { QuotationAdditionalInput } from '../actions'
import { type AdditionalOption, type UnitBasis, UNIT_BASIS_LABEL, toNumber } from './types'
import { isMarginAdditional } from './leg-margin-selector'
import { normalizeName } from '@/lib/quotation/estimate'
import { randomLocalId } from '@/lib/utils/id'

/** Pedágio agora é um campo dedicado de cada trecho (legs-editor.tsx) — não pode
 *  também aparecer aqui como adicional geral, senão conta 2x. */
const GENERAL_EXCLUDED_NAMES = ['Pedágio']
function isExcludedFromGeneral(name: string): boolean {
  return GENERAL_EXCLUDED_NAMES.some((n) => normalizeName(n) === normalizeName(name))
}

type SubtypeState = { checked: boolean; value: string; observation: string }

type Entry = {
  included: boolean
  value: string // VALUE: valor em R$ | PERCENT: alíquota %
  observation: string
  unitBasis: UnitBasis | ''
  subtypes: Record<string, SubtypeState>
}

const emptyEntry = (): Entry => ({
  included: false,
  value: '',
  observation: '',
  unitBasis: '',
  subtypes: {},
})

const emptySub = (): SubtypeState => ({ checked: false, value: '', observation: '' })

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
      // SUBTYPES — cada subtipo tem valor e observação próprios
      const unitBasis = a.has_unit_basis ? e.unitBasis || null : null
      for (const st of a.subtypes) {
        const sub = e.subtypes[st.id]
        if (sub?.checked) {
          selections.push({
            additionalId: a.id,
            subtypeId: st.id,
            value: toNumber(sub.value),
            unitBasis,
            observation: sub.observation.trim() || null,
          })
        }
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

/** Reconstrói o estado interno (edição) a partir das seleções já salvas de uma cotação. */
function buildInitial(initial: QuotationAdditionalInput[]): { state: State; manuals: ManualRow[] } {
  const state: State = {}
  const manuals: ManualRow[] = []

  for (const sel of initial) {
    if (sel.customName) {
      manuals.push({
        id: randomLocalId(),
        name: sel.customName,
        value: sel.value != null ? String(sel.value) : '',
        observation: sel.observation ?? '',
      })
      continue
    }
    if (!sel.additionalId) continue

    const current = state[sel.additionalId] ?? emptyEntry()
    if (sel.subtypeId) {
      state[sel.additionalId] = {
        ...current,
        included: true,
        unitBasis: sel.unitBasis ?? current.unitBasis,
        subtypes: {
          ...current.subtypes,
          [sel.subtypeId]: {
            checked: true,
            value: sel.value != null ? String(sel.value) : '',
            observation: sel.observation ?? '',
          },
        },
      }
    } else {
      state[sel.additionalId] = {
        ...current,
        included: true,
        value:
          sel.percent != null ? String(sel.percent) : sel.value != null ? String(sel.value) : '',
        observation: sel.observation ?? '',
      }
    }
  }

  return { state, manuals }
}

export function AdditionalsSelector({
  additionals,
  initial,
  onChange,
}: {
  /** Catálogo completo — as 3 margens esquerda e o ICMS são lançados por trecho, não aqui. */
  additionals: AdditionalOption[]
  /** Seleções já salvas, para pré-preencher o formulário em modo edição. */
  initial?: QuotationAdditionalInput[]
  onChange: (selections: QuotationAdditionalInput[]) => void
}) {
  const generalAdditionals = additionals.filter(
    (a) =>
      !isMarginAdditional(a.name) && !isExcludedFromGeneral(a.name) && a.input_type !== 'PERCENT'
  )
  const [state, setState] = useState<State>(() => buildInitial(initial ?? []).state)
  const [manuals, setManuals] = useState<ManualRow[]>(() => buildInitial(initial ?? []).manuals)

  function emit(nextState: State, nextManuals: ManualRow[]) {
    onChange(derive(generalAdditionals, nextState, nextManuals))
  }

  function setEntry(id: string, patch: Partial<Entry>) {
    const current = state[id] ?? emptyEntry()
    const next = { ...state, [id]: { ...current, ...patch } }
    setState(next)
    emit(next, manuals)
  }

  function setSubtype(addId: string, stId: string, patch: Partial<SubtypeState>) {
    const current = state[addId] ?? emptyEntry()
    const sub = current.subtypes[stId] ?? emptySub()
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
      {generalAdditionals.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum adicional cadastrado.</p>
      ) : (
        generalAdditionals.map((a) => {
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
                      <CurrencyInput
                        value={e.value}
                        onValueChange={(v) => setEntry(a.id, { value: v })}
                        placeholder="R$ 0,00"
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
                      <div className="flex flex-col gap-3 pl-6">
                        {a.subtypes.map((st) => {
                          const sub = e.subtypes[st.id] ?? emptySub()
                          return (
                            <div key={st.id} className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
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
                                  <CurrencyInput
                                    value={sub.value}
                                    onValueChange={(v) => setSubtype(a.id, st.id, { value: v })}
                                    placeholder="R$ 0,00"
                                    className="h-9 w-36"
                                  />
                                )}
                              </div>
                              {sub.checked && (
                                <Textarea
                                  rows={2}
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
                    </>
                  )}

                  {/* Observação no nível do adicional (subtipos têm a própria) */}
                  {a.input_type !== 'SUBTYPES' && (
                    <div className="flex flex-col gap-2">
                      {/* Textos prontos cadastrados no Admin (ex.: "15 dias" no
                          Limite de permanência). Clicar preenche o campo, que
                          continua livre para alterar ou apagar. */}
                      {a.presets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {a.presets.map((preset) => {
                            const active = e.observation.trim() === preset
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  setEntry(a.id, { observation: active ? '' : preset })
                                }
                                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                  active
                                    ? 'border-brand-600 bg-brand-50 text-brand-800'
                                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {preset}
                              </button>
                            )
                          })}
                          {e.observation.trim() !== '' && (
                            <button
                              type="button"
                              onClick={() => setEntry(a.id, { observation: '' })}
                              className="text-xs font-medium text-slate-400 hover:text-slate-600"
                            >
                              limpar
                            </button>
                          )}
                        </div>
                      )}
                      <Textarea
                        rows={2}
                        value={e.observation}
                        onChange={(ev) => setEntry(a.id, { observation: ev.target.value })}
                        placeholder={
                          a.presets.length > 0
                            ? 'Escolha acima ou digite outra informação'
                            : a.input_type === 'OBSERVATION'
                              ? 'Observação'
                              : 'Observação (opcional)'
                        }
                      />
                    </div>
                  )}
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
                  <CurrencyInput
                    value={m.value}
                    onValueChange={(v) => setManualRow(m.id, { value: v })}
                    placeholder="R$ 0,00"
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
