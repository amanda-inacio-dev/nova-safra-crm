'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login, type AuthState } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </Button>
  )
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(login, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Acessar o sistema</h1>
        <p className="mt-1 text-sm text-slate-500">Entre com seu e-mail e senha.</p>
      </div>

      {notice && <FormMessage type="success">{notice}</FormMessage>}
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@novasafra.com.br"
        />
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />

      <Link
        href="/forgot-password"
        className="text-brand-700 hover:text-brand-800 text-center text-sm font-medium"
      >
        Esqueci minha senha
      </Link>
    </form>
  )
}
