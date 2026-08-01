'use client'

import { AddressInput } from '@/components/ui/address-input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LegMarginSelector } from './leg-margin-selector'
import type { QuotationAdditionalInput } from '../actions'
import type { AdditionalOption, NameOption } from './types'

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

function LegCard({
  leg,
  additionals,
  onChange,
  onRemove,
  removable,
}: {
  leg: LegRow
  additionals: AdditionalOption[]
  onChange: (patch: Partial<LegRow>) => void
  onRemove: () => void
  removable: boolean
}) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <Label>Origem</Label>
          <AddressInput
            value={leg.origin}
            onChange={(v) => onChange({ origin: v })}
            placeholder="Cidade / endereço de origem"
            list="route-origins-list"
          />
        </div>
        <div>
          <Label>Destino</Label>
          <AddressInput
            value={leg.destination}
            onChange={(v) => onChange({ destination: v })}
            placeholder="Cidade / endereço de destino"
            list="route-destinations-list"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={!removable}
          className="h-10 rounded-md px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          Remover
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={leg.freightIncluded}
              onChange={(e) => onChange({ freightIncluded: e.target.checked })}
            />
            Frete (R$)
          </label>
          <CurrencyInput
            value={leg.freightValue}
            onValueChange={(v) => onChange({ freightValue: v })}
            placeholder="R$ 0,00"
          />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={leg.tollIncluded}
              onChange={(e) => onChange({ tollIncluded: e.target.checked })}
            />
            Pedágio (R$)
          </label>
          <CurrencyInput
            value={leg.tollValue}
            onValueChange={(v) => onChange({ tollValue: v })}
            placeholder="R$ 0,00"
          />
        </div>
        <div>
          <Label>ICMS deste trecho (%)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={leg.icmsRate}
            onChange={(e) => onChange({ icmsRate: e.target.value })}
            placeholder="Ex.: 12"
          />
        </div>
      </div>

      <div className="mt-3">
        <LegMarginSelector
          additionals={additionals}
          initial={leg.additionals}
          onChange={(sel) => onChange({ additionals: sel })}
        />
      </div>
    </div>
  )
}

function LegGroupBlock({
  title,
  legs,
  additionals,
  onUpdate,
  onRemove,
  onAdd,
}: {
  title: string
  legs: { leg: LegRow; index: number }[]
  additionals: AdditionalOption[]
  onUpdate: (index: number, patch: Partial<LegRow>) => void
  onRemove: (index: number) => void
  onAdd: () => void
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">Trechos — {title}</h3>
      <div className="flex flex-col gap-3">
        {legs.map(({ leg, index }) => (
          <LegCard
            key={index}
            leg={leg}
            additionals={additionals}
            onChange={(patch) => onUpdate(index, patch)}
            onRemove={() => onRemove(index)}
            removable={legs.length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="text-brand-700 hover:text-brand-800 mt-2 text-sm font-medium"
      >
        + Adicionar trecho ({title})
      </button>
    </div>
  )
}

/** Datalists compartilhados (um único id serve todos os campos Origem/Destino da
 *  tela) — são sugestões, não travam o AddressInput: o usuário pode digitar outra coisa. */
function RouteDatalists({
  routeOrigins,
  routeDestinations,
}: {
  routeOrigins: NameOption[]
  routeDestinations: NameOption[]
}) {
  return (
    <>
      <datalist id="route-origins-list">
        {routeOrigins.map((o) => (
          <option key={o.id} value={o.name} />
        ))}
      </datalist>
      <datalist id="route-destinations-list">
        {routeDestinations.map((d) => (
          <option key={d.id} value={d.name} />
        ))}
      </datalist>
    </>
  )
}

export function LegsEditor({
  legs,
  additionals,
  routeOrigins,
  routeDestinations,
  showGroups,
  onChange,
}: {
  legs: LegRow[]
  additionals: AdditionalOption[]
  routeOrigins: NameOption[]
  routeDestinations: NameOption[]
  /** true quando a operação é Importação > DTA+DI — separa os trechos em blocos DTA/DI. */
  showGroups?: boolean
  onChange: (legs: LegRow[]) => void
}) {
  function update(i: number, patch: Partial<LegRow>) {
    onChange(legs.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function remove(i: number) {
    onChange(legs.filter((_, idx) => idx !== i))
  }
  function add(legGroup: LegGroup = '') {
    onChange([...legs, emptyLeg(legGroup)])
  }

  if (showGroups) {
    const indexed = legs.map((leg, index) => ({ leg, index }))
    return (
      <div className="flex flex-col gap-6">
        <RouteDatalists routeOrigins={routeOrigins} routeDestinations={routeDestinations} />
        <LegGroupBlock
          title="DTA"
          legs={indexed.filter(({ leg }) => leg.legGroup !== 'DI')}
          additionals={additionals}
          onUpdate={update}
          onRemove={remove}
          onAdd={() => add('DTA')}
        />
        <LegGroupBlock
          title="DI"
          legs={indexed.filter(({ leg }) => leg.legGroup === 'DI')}
          additionals={additionals}
          onUpdate={update}
          onRemove={remove}
          onAdd={() => add('DI')}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <RouteDatalists routeOrigins={routeOrigins} routeDestinations={routeDestinations} />
      {legs.map((leg, i) => (
        <LegCard
          key={i}
          leg={leg}
          additionals={additionals}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
          removable={legs.length > 1}
        />
      ))}
      <div>
        <button
          type="button"
          onClick={() => add()}
          className="text-brand-700 hover:text-brand-800 text-sm font-medium"
        >
          + Adicionar trecho
        </button>
      </div>
    </div>
  )
}
