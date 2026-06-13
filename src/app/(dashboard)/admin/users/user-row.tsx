'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateUser, toggleUserActive, type UserActionState } from './actions'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { UserRole } from '@/types'

export type UserRowData = {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

function SaveButton() {
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

function ToggleButton({ active, disabled }: { active: boolean; disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={
        active
          ? 'text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40'
          : 'text-sm font-medium text-green-600 hover:text-green-700 disabled:opacity-40'
      }
      title={disabled ? 'Você não pode desativar a própria conta' : undefined}
    >
      {pending ? '…' : active ? 'Desativar' : 'Reativar'}
    </button>
  )
}

export function UserRow({ user, isSelf }: { user: UserRowData; isSelf: boolean }) {
  const [state, formAction] = useActionState<UserActionState, FormData>(updateUser, {})

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={user.id} />
          <Input name="name" defaultValue={user.name} className="h-9 w-44" aria-label="Nome" />
          <Select name="role" defaultValue={user.role} className="h-9 w-40" aria-label="Perfil">
            <option value="ADMIN">Administrador</option>
            <option value="COMMERCIAL">Comercial</option>
            <option value="OPERATION">Operação</option>
          </Select>
          <SaveButton />
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
          {state.success && <span className="text-xs text-green-600">{state.success}</span>}
        </form>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
      <td className="px-4 py-3">
        <span
          className={
            user.active
              ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700'
              : 'inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
          }
        >
          {user.active ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td className="px-4 py-3">
        <form action={toggleUserActive}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="active" value={(!user.active).toString()} />
          <ToggleButton active={user.active} disabled={isSelf && user.active} />
        </form>
      </td>
    </tr>
  )
}
