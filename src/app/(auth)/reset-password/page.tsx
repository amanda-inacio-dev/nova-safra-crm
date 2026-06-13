'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePassword, type AuthState } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar nova senha'}
    </Button>
  )
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState<AuthState, FormData>(updatePassword, {})

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Definir nova senha</h1>
        <p className="mt-1 text-sm text-slate-500">
          Escolha uma senha com pelo menos 8 caracteres.
        </p>
      </div>

      {state.error && <FormMessage type="error">{state.error}</FormMessage>}

      <div>
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
        />
      </div>

      <div>
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
