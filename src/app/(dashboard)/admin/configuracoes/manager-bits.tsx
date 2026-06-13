'use client'

import { useFormStatus } from 'react-dom'

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
          : 'inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
      }
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function ToggleButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        active
          ? 'text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40'
          : 'text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-40'
      }
    >
      {pending ? '…' : active ? 'Desativar' : 'Reativar'}
    </button>
  )
}

export function ToggleActive({
  id,
  active,
  action,
}: {
  id: string
  active: boolean
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={(!active).toString()} />
      <ToggleButton active={active} />
    </form>
  )
}

export function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-brand-700 hover:text-brand-800 text-sm font-medium disabled:opacity-60"
    >
      {pending ? 'Salvando…' : 'Salvar'}
    </button>
  )
}
