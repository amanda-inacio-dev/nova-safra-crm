'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { requestPasswordReset, type AuthState } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Enviando…' : 'Enviar link de recuperação'}
    </Button>
  )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState<AuthState, FormData>(requestPasswordReset, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Recuperar senha</h1>
        <p className="mt-1 text-sm text-slate-500">
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      {state.success && <FormMessage type="success">{state.success}</FormMessage>}

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

      <SubmitButton />

      <Link
        href="/login"
        className="text-brand-700 hover:text-brand-800 text-center text-sm font-medium"
      >
        Voltar para o login
      </Link>
    </form>
  )
}
