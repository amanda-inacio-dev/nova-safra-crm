'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Image from 'next/image'
import { updateSettings } from './settings-actions'
import type { ConfigActionState } from './additionals-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'

export type AppSettings = {
  company_name: string | null
  logo_url: string | null
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar'}
    </Button>
  )
}

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updateSettings, {})
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url ?? null)

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setLogoPreview(file ? URL.createObjectURL(file) : (settings.logo_url ?? null))
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Empresa</h2>
        <p className="text-sm text-slate-500">
          Nome e logo principal usados no sistema e nos PDFs.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5 px-5 py-4">
        <div className="max-w-md">
          <Label htmlFor="company_name">Nome da empresa</Label>
          <Input
            id="company_name"
            name="company_name"
            required
            defaultValue={settings.company_name ?? ''}
          />
        </div>

        <div>
          <Label htmlFor="logo">Logo principal</Label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logo da empresa"
                width={96}
                height={96}
                unoptimized
                className="h-24 w-24 rounded-md border border-slate-200 object-contain"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-400">
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

        <div className="flex items-center gap-3">
          <SaveButton />
          {state.error && <FormMessage type="error">{state.error}</FormMessage>}
          {state.ok && <FormMessage type="success">Configurações salvas.</FormMessage>}
        </div>
      </form>
    </section>
  )
}
