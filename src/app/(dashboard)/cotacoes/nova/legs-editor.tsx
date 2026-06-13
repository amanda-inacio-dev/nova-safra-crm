'use client'

import { AddressInput } from '@/components/ui/address-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type LegRow = { origin: string; destination: string; value: string }

export const emptyLeg = (): LegRow => ({ origin: '', destination: '', value: '' })

export function LegsEditor({
  legs,
  onChange,
}: {
  legs: LegRow[]
  onChange: (legs: LegRow[]) => void
}) {
  function update(i: number, patch: Partial<LegRow>) {
    onChange(legs.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function remove(i: number) {
    onChange(legs.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-3">
      {legs.map((leg, i) => (
        <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
          <div>
            {i === 0 && <Label>Origem</Label>}
            <AddressInput
              value={leg.origin}
              onChange={(v) => update(i, { origin: v })}
              placeholder="Cidade / endereço de origem"
            />
          </div>
          <div>
            {i === 0 && <Label>Destino</Label>}
            <AddressInput
              value={leg.destination}
              onChange={(v) => update(i, { destination: v })}
              placeholder="Cidade / endereço de destino"
            />
          </div>
          <div>
            {i === 0 && <Label>Valor (R$)</Label>}
            <Input
              type="number"
              step="0.01"
              min="0"
              value={leg.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder="0,00"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={legs.length === 1}
            className="h-10 rounded-md px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Remover
          </button>
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={() => onChange([...legs, emptyLeg()])}
          className="text-brand-700 hover:text-brand-800 text-sm font-medium"
        >
          + Adicionar trecho
        </button>
      </div>
    </div>
  )
}
