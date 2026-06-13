'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import {
  createAdditional,
  updateAdditional,
  toggleAdditional,
  type ConfigActionState,
} from './additionals-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { StatusBadge, ToggleActive, SaveButton } from './manager-bits'

export type Additional = {
  id: string
  name: string
  value: number
  active: boolean
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function CreateButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adicionando…' : 'Adicionar'}
    </Button>
  )
}

function Row({ item }: { item: Additional }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updateAdditional, {})
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3" colSpan={2}>
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <Input name="name" defaultValue={item.name} className="h-9 w-56" aria-label="Nome" />
          <Input
            name="value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item.value}
            className="h-9 w-32"
            aria-label="Valor"
          />
          <SaveButton />
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        </form>
      </td>
      <td className="px-4 py-3">
        <StatusBadge active={item.active} />
      </td>
      <td className="px-4 py-3">
        <ToggleActive id={item.id} active={item.active} action={toggleAdditional} />
      </td>
    </tr>
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
        <p className="text-sm text-slate-500">Custos extras (pedágio, escolta, seguro, etc.).</p>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
          <Input name="name" required placeholder="Ex.: Pedágio" className="w-56" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Valor (R$)</label>
          <Input name="value" type="number" step="0.01" min="0" defaultValue="0" className="w-32" />
        </div>
        <CreateButton />
        {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      </form>

      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <th className="px-4 py-2" colSpan={2}>
              Nome / Valor
            </th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                Nenhum adicional cadastrado.
              </td>
            </tr>
          ) : (
            items.map((item) => <Row key={item.id} item={item} />)
          )}
        </tbody>
      </table>
      <p className="px-4 py-2 text-xs text-slate-400">
        Total ativo:{' '}
        {brl(items.filter((i) => i.active).reduce((sum, i) => sum + Number(i.value), 0))}
      </p>
    </section>
  )
}
