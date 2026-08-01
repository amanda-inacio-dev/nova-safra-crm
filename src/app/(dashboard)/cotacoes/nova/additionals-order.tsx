'use client'

import type { QuotationAdditionalInput } from '../actions'
import type { AdditionalOption } from './types'

/**
 * Ordem em que os adicionais saem no PDF.
 *
 * Mostra os que já estão marcados na cotação e deixa mover cada um para cima
 * ou para baixo. A ordem aqui é exatamente a ordem gravada (`sort_order`,
 * migration 0031) e usada no documento.
 */
export function AdditionalsOrder({
  selections,
  additionals,
  onChange,
}: {
  selections: QuotationAdditionalInput[]
  additionals: AdditionalOption[]
  onChange: (next: QuotationAdditionalInput[]) => void
}) {
  function labelOf(selection: QuotationAdditionalInput): string {
    if (selection.customName) return selection.customName
    const additional = additionals.find((a) => a.id === selection.additionalId)
    if (!additional) return 'Adicional'
    if (!selection.subtypeId) return additional.name
    const subtype = additional.subtypes.find((s) => s.id === selection.subtypeId)
    return subtype ? `${additional.name} · ${subtype.name}` : additional.name
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= selections.length) return
    const next = [...selections]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  if (selections.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Marque adicionais acima para definir a ordem deles no PDF.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {selections.map((selection, index) => (
        <div
          key={`${selection.additionalId ?? selection.customName ?? 'item'}-${selection.subtypeId ?? ''}-${index}`}
          className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2"
        >
          <span className="w-6 text-xs font-medium text-slate-400">{index + 1}º</span>
          <span className="flex-1 truncate text-sm text-slate-700">{labelOf(selection)}</span>
          <button
            type="button"
            onClick={() => move(index, -1)}
            disabled={index === 0}
            aria-label="Mover para cima"
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(index, 1)}
            disabled={index === selections.length - 1}
            aria-label="Mover para baixo"
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  )
}
