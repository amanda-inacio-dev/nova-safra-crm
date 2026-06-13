'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createPort, updatePort, togglePort } from './ports-actions'
import type { ConfigActionState } from './additionals-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { StatusBadge, ToggleActive, SaveButton } from './manager-bits'

export type Port = {
  id: string
  name: string
  active: boolean
}

function CreateButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Adicionando…' : 'Adicionar'}
    </Button>
  )
}

function Row({ item }: { item: Port }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updatePort, {})
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <Input name="name" defaultValue={item.name} className="h-9 w-72" aria-label="Nome" />
          <SaveButton />
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        </form>
      </td>
      <td className="px-4 py-3">
        <StatusBadge active={item.active} />
      </td>
      <td className="px-4 py-3">
        <ToggleActive id={item.id} active={item.active} action={togglePort} />
      </td>
    </tr>
  )
}

export function PortsManager({ items }: { items: Port[] }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(createPort, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Portos e Pátios</h2>
        <p className="text-sm text-slate-500">
          Lista de retirada/devolução de container vazio usada na cotação.
        </p>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
          <Input name="name" required placeholder="Ex.: Porto de Santos" className="w-72" />
        </div>
        <CreateButton />
        {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      </form>

      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <th className="px-4 py-2">Nome</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                Nenhum porto/pátio cadastrado.
              </td>
            </tr>
          ) : (
            items.map((item) => <Row key={item.id} item={item} />)
          )}
        </tbody>
      </table>
    </section>
  )
}
