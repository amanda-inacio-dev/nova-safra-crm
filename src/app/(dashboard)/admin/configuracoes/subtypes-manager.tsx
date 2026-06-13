'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createSubtype, updateSubtype, toggleSubtype } from './subtypes-actions'
import type { ConfigActionState } from './additionals-actions'
import { Input } from '@/components/ui/input'
import { StatusBadge, ToggleActive, SaveButton } from './manager-bits'

export type Subtype = {
  id: string
  name: string
  active: boolean
}

function AddButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand-800 hover:bg-brand-700 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Adicionando…' : 'Adicionar subtipo'}
    </button>
  )
}

function SubtypeRow({ subtype }: { subtype: Subtype }) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(updateSubtype, {})
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="id" value={subtype.id} />
        <Input
          name="name"
          defaultValue={subtype.name}
          className="h-8 w-52 text-sm"
          aria-label="Subtipo"
        />
        <SaveButton />
      </form>
      <StatusBadge active={subtype.active} />
      <ToggleActive id={subtype.id} active={subtype.active} action={toggleSubtype} />
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </div>
  )
}

export function SubtypesManager({
  additionalId,
  subtypes,
}: {
  additionalId: string
  subtypes: Subtype[]
}) {
  const [state, formAction] = useActionState<ConfigActionState, FormData>(createSubtype, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state.ok])

  return (
    <div className="mt-3 rounded-md bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Subtipos</p>

      {subtypes.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum subtipo ainda.</p>
      ) : (
        <div className="flex flex-col">
          {subtypes.map((s) => (
            <SubtypeRow key={s.id} subtype={s} />
          ))}
        </div>
      )}

      <form ref={formRef} action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="additional_id" value={additionalId} />
        <Input name="name" placeholder='Ex.: 40"' className="h-8 w-52 text-sm" />
        <AddButton />
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      </form>
    </div>
  )
}
