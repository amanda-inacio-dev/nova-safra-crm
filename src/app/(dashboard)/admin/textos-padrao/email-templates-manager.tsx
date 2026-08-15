'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import { updateEmailTemplate } from './email-templates-actions'
import type { ConfigActionState } from '../configuracoes/additionals-actions'
import type { EmailTemplateKey } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { SaveButton } from '../configuracoes/manager-bits'

export type EmailTemplateRow = {
  key: EmailTemplateKey
  subject: string
  body: string
  image_url: string | null
}

const TEMPLATE_LABEL: Record<EmailTemplateKey, { title: string; description: string }> = {
  client_followup_request: {
    title: 'Solicitação de retorno ao cliente',
    description: 'Usado quando o comercial solicita retorno de uma cotação sem resposta.',
  },
  prospection_industria: {
    title: 'Prospecção — Indústria',
    description: 'Corpo do e-mail de apresentação enviado a prospects do segmento indústria.',
  },
  prospection_cafe: {
    title: 'Prospecção — Café',
    description: 'Corpo do e-mail de apresentação enviado a prospects do segmento café.',
  },
  birthday_message: {
    title: 'Mensagem de aniversário',
    description: 'Texto e imagem enviados aos aniversariantes cadastrados.',
  },
}

function TemplateForm({ item }: { item: EmailTemplateRow }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updateEmailTemplate, {})
  const label = TEMPLATE_LABEL[item.key]

  return (
    <div className="border-t border-slate-100 px-5 py-4 first:border-t-0">
      <p className="text-sm font-semibold text-slate-800">{label.title}</p>
      <p className="mb-3 text-xs text-slate-500">{label.description}</p>

      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="key" value={item.key} />

        <div>
          <Label htmlFor={`subject-${item.key}`}>Assunto</Label>
          <Input id={`subject-${item.key}`} name="subject" defaultValue={item.subject} required />
        </div>

        <div>
          <Label htmlFor={`body-${item.key}`}>Texto</Label>
          <Textarea
            id={`body-${item.key}`}
            name="body"
            defaultValue={item.body}
            rows={4}
            required
          />
        </div>

        <div className="flex items-end gap-4">
          {item.image_url && (
            <Image
              src={item.image_url}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded object-contain"
            />
          )}
          <div className="flex-1">
            <Label htmlFor={`image-${item.key}`}>Imagem (opcional)</Label>
            <Input
              id={`image-${item.key}`}
              name="image"
              type="file"
              accept="image/*"
              className="cursor-pointer py-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SaveButton />
          {state.error && <FormMessage type="error">{state.error}</FormMessage>}
          {state.ok && <FormMessage type="success">Template salvo.</FormMessage>}
        </div>
      </form>
    </div>
  )
}

export function EmailTemplatesManager({ items }: { items: EmailTemplateRow[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      {items.map((item) => (
        <TemplateForm key={item.key} item={item} />
      ))}
    </section>
  )
}
