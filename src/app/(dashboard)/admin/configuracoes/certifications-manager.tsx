'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import {
  createCertification,
  updateCertification,
  toggleCertification,
} from './certifications-actions'
import type { ConfigActionState } from './additionals-actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { StatusBadge, ToggleActive, SaveButton } from './manager-bits'

export type Certification = {
  id: string
  name: string
  image_url: string | null
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

function Row({ item }: { item: Certification }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updateCertification, {})
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 rounded object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
            —
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <Input name="name" defaultValue={item.name} className="h-9 w-56" aria-label="Nome" />
          <Input
            name="image"
            type="file"
            accept="image/*"
            className="h-9 w-56 cursor-pointer py-1.5 text-xs"
            aria-label="Trocar imagem"
          />
          <SaveButton />
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        </form>
      </td>
      <td className="px-4 py-3">
        <StatusBadge active={item.active} />
      </td>
      <td className="px-4 py-3">
        <ToggleActive id={item.id} active={item.active} action={toggleCertification} />
      </td>
    </tr>
  )
}

export function CertificationsManager({ items }: { items: Certification[] }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(createCertification, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Certificações</h2>
        <p className="text-sm text-slate-500">
          Logos de certificação para incluir no PDF da cotação.
        </p>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-5 py-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
          <Input name="name" required placeholder="Ex.: ISO 9001" className="w-56" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Logo</label>
          <Input name="image" type="file" accept="image/*" className="w-64 cursor-pointer py-2" />
        </div>
        <CreateButton />
        {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      </form>

      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <th className="px-4 py-2">Logo</th>
            <th className="px-4 py-2">Nome</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                Nenhuma certificação cadastrada.
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
