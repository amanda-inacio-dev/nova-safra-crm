'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import type { ClientActionState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { formatCnpj } from '@/lib/utils/cnpj'

export type ClientInitial = {
  id: string
  name: string
  contact_name: string | null
  cnpj: string | null
  email: string | null
  phone: string | null
  logo_url: string | null
}

type Action = (prev: ClientActionState, formData: FormData) => Promise<ClientActionState>

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar cliente'}
    </Button>
  )
}

export function ClientForm({ action, initial }: { action: Action; initial?: ClientInitial }) {
  const [state, formAction] = useActionState<ClientActionState, FormData>(action, {})
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? '')
  const [logoPreview, setLogoPreview] = useState<string | null>(initial?.logo_url ?? null)

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setLogoPreview(file ? URL.createObjectURL(file) : (initial?.logo_url ?? null))
  }

  return (
    <form action={formAction} className="max-w-2xl">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Razão social *</Label>
            <Input id="name" name="name" required defaultValue={initial?.name ?? ''} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="contact_name">Contato</Label>
            <Input
              id="contact_name"
              name="contact_name"
              defaultValue={initial?.contact_name ?? ''}
              placeholder="Nome da pessoa de contato"
            />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initial?.phone ?? ''}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="email">E-mail de contato</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial?.email ?? ''}
              placeholder="contato@empresa.com"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="logo">Logo da empresa</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Pré-visualização da logo"
                  width={80}
                  height={80}
                  unoptimized
                  className="h-20 w-20 rounded-md border border-slate-200 object-contain"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-400">
                  Sem logo
                </div>
              )}
              <Input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={onLogoChange}
                className="cursor-pointer py-2"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">PNG ou JPG, até 5 MB.</p>
          </div>
        </div>

        {state.error && (
          <div className="mt-5">
            <FormMessage type="error">{state.error}</FormMessage>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <SubmitButton editing={Boolean(initial)} />
          <Link
            href="/clientes"
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </form>
  )
}
