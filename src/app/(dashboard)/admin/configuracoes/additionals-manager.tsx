'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import {
  createAdditional,
  updateAdditional,
  toggleAdditional,
  type ConfigActionState,
  type AdditionalInputType,
} from './additionals-actions'
import { SubtypesManager, type Subtype } from './subtypes-manager'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { StatusBadge, ToggleActive, SaveButton } from './manager-bits'

export type Additional = {
  id: string
  name: string
  input_type: AdditionalInputType
  has_unit_basis: boolean
  active: boolean
  subtypes: Subtype[]
}

const TYPE_HINT: Record<AdditionalInputType, string> = {
  VALUE: 'No formulário: um campo de valor.',
  SUBTYPES: 'No formulário: as opções abaixo, com um valor para cada marcada.',
  OBSERVATION: 'No formulário: um campo de observação (texto livre), sem valor.',
  PERCENT: 'No formulário: uma alíquota (%) aplicada sobre o total (ex.: ICMS).',
}

function TypeOptions() {
  return (
    <>
      <option value="VALUE">Valor (campo de valor)</option>
      <option value="SUBTYPES">Subtipos (valor em cada)</option>
      <option value="OBSERVATION">Observação (texto, sem valor)</option>
      <option value="PERCENT">Percentual (% sobre o total)</option>
    </>
  )
}

function CreateButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adicionando…' : 'Adicionar'}
    </Button>
  )
}

function Card({ item }: { item: Additional }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updateAdditional, {})
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={item.id} />
        <Input name="name" defaultValue={item.name} className="h-9 w-64" aria-label="Nome" />
        <Select
          name="input_type"
          defaultValue={item.input_type}
          className="h-9 w-52"
          aria-label="Comportamento"
        >
          <TypeOptions />
        </Select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input type="checkbox" name="has_unit_basis" defaultChecked={item.has_unit_basis} />
          Por veículo/container
        </label>
        <SaveButton />
        <StatusBadge active={item.active} />
        <ToggleActive id={item.id} active={item.active} action={toggleAdditional} />
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      </form>

      <p className="mt-2 text-xs text-slate-400">{TYPE_HINT[item.input_type]}</p>

      {item.input_type === 'SUBTYPES' && (
        <SubtypesManager additionalId={item.id} subtypes={item.subtypes} />
      )}
    </div>
  )
}

export function AdditionalsManager({ items }: { items: Additional[] }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(createAdditional, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Adicionais</h2>
        <p className="text-sm text-slate-500">
          Custos extras da cotação. O valor é informado no formulário; aqui você define apenas os
          nomes e como cada um aparece.
        </p>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
          <Input name="name" required placeholder="Ex.: Pedágio" className="w-64" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Comportamento</label>
          <Select name="input_type" defaultValue="VALUE" className="w-52">
            <TypeOptions />
          </Select>
        </div>
        <label className="mb-2 flex items-center gap-1.5 text-xs text-slate-600">
          <input type="checkbox" name="has_unit_basis" />
          Por veículo/container
        </label>
        <CreateButton />
        {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      </form>

      <div className="flex flex-col gap-3 p-5">
        {items.length === 0 ? (
          <p className="text-center text-sm text-slate-500">Nenhum adicional cadastrado.</p>
        ) : (
          items.map((item) => <Card key={item.id} item={item} />)
        )}
      </div>
    </section>
  )
}
