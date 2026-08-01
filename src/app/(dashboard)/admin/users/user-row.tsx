'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateUser, toggleUserActive, resetUserPassword, type UserActionState } from './actions'
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

function SaveButton({
  label = 'Salvar',
  pendingLabel = 'Salvando…',
}: {
  label?: string
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-brand-700 hover:text-brand-800 text-sm font-medium disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
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

/** Redefine a senha de login do usuário. Não existe forma de "ver" a senha atual
 *  (nenhum sistema sério guarda ela de um jeito recuperável) — só dá pra definir
 *  uma nova. Bloqueado pro admin mexer na senha de OUTRO admin. */
function PasswordResetForm({
  userId,
  disabled,
  isSelf,
}: {
  userId: string
  disabled: boolean
  isSelf: boolean
}) {
  const router = useRouter()
  const [state, formAction] = useActionState<UserActionState, FormData>(resetUserPassword, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state.success) return
    formRef.current?.reset()
    // Trocar a PRÓPRIA senha invalida a sessão atual na hora — se não sairmos por
    // conta própria, a próxima ação nessa tela trava com um erro confuso.
    if (isSelf) {
      window.alert(
        'Senha alterada. Você será desconectado — faça login novamente com a nova senha.'
      )
      router.push('/login')
    }
  }, [state.success, isSelf, router])

  if (disabled) {
    return <span className="text-xs text-slate-400">Só o próprio admin pode alterar</span>
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <Input
        name="password"
        type="password"
        placeholder="Nova senha"
        className="h-9 w-32"
        aria-label="Nova senha"
      />
      <SaveButton label="Definir" pendingLabel="Definindo…" />
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.success && !isSelf && <span className="text-xs text-green-600">{state.success}</span>}
    </form>
  )
}

export function UserRow({ user, isSelf }: { user: UserRowData; isSelf: boolean }) {
  const [state, formAction] = useActionState<UserActionState, FormData>(updateUser, {})
  const canResetPassword = user.role !== 'ADMIN' || isSelf

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={user.id} />
          <Input name="name" defaultValue={user.name} className="h-9 w-40" aria-label="Nome" />
          <Input
            name="email"
            type="email"
            defaultValue={user.email}
            className="h-9 w-48"
            aria-label="E-mail"
          />
          <Select name="role" defaultValue={user.role} className="h-9 w-36" aria-label="Perfil">
            <option value="ADMIN">Administrador</option>
            <option value="COMMERCIAL">Comercial</option>
            <option value="OPERATION">Operação</option>
          </Select>
          <SaveButton />
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
          {state.success && <span className="text-xs text-green-600">{state.success}</span>}
        </form>
      </td>
      <td className="px-4 py-3">
        <PasswordResetForm userId={user.id} disabled={!canResetPassword} isSelf={isSelf} />
      </td>
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
