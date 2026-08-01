'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createPreset, updatePreset, deletePreset } from './presets-actions'
import type { ConfigActionState } from './additionals-actions'
import { Input } from '@/components/ui/input'
import { SaveButton } from './manager-bits'

export type Preset = {
  id: string
  text: string
}

function AddButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand-800 hover:bg-brand-700 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Adicionando…' : 'Adicionar texto'}
    </button>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
    >
      {pending ? 'Excluindo…' : 'Excluir'}
    </button>
  )
}

function PresetRow({ preset }: { preset: Preset }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updatePreset, {})
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={preset.id} />
        <Input
          name="text"
          defaultValue={preset.text}
          className="h-8 w-52 text-sm"
          aria-label="Texto padrão"
        />
        <SaveButton />
      </form>
      <form action={deletePreset}>
        <input type="hidden" name="id" value={preset.id} />
        <DeleteButton />
      </form>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </div>
  )
}

/**
 * Respostas prontas para o campo de observação de um adicional.
 *
 * O campo continua sendo texto livre na cotação — isto aqui só oferece atalhos
 * (ex.: "15 dias" no Limite de permanência) que a pessoa clica e pode alterar.
 */
export function PresetsManager({
  additionalId,
  presets,
}: {
  additionalId: string
  presets: Preset[]
}) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(createPreset, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <div className="mt-3 rounded-md bg-slate-50 p-3">
      <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Textos padrão da observação
      </p>
      <p className="mb-2 text-xs text-slate-400">
        Aparecem como atalho no formulário da cotação. O campo continua livre para digitar outra
        coisa.
      </p>

      {presets.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum texto padrão ainda.</p>
      ) : (
        <div className="flex flex-col">
          {presets.map((p) => (
            <PresetRow key={p.id} preset={p} />
          ))}
        </div>
      )}

      <form ref={formRef} action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="additional_id" value={additionalId} />
        <Input name="text" placeholder="Ex.: 15 dias" className="h-8 w-52 text-sm" />
        <AddButton />
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      </form>
    </div>
  )
}
