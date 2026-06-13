'use client'

import { useFormStatus } from 'react-dom'
import { logout } from '@/app/(auth)/actions'

function Button() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
    >
      {pending ? 'Saindo…' : 'Sair'}
    </button>
  )
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button />
    </form>
  )
}
