'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { changeMyPassword, type PasswordState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Alterando…' : 'Alterar senha'}
    </Button>
  )
}

export function PasswordForm() {
  const [state, formAction] = useActionState<PasswordState, FormData>(changeMyPassword, {})

  return (
    <form
      action={formAction}
      className="flex max-w-md flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Alterar minha senha</h2>
        <p className="mt-1 text-sm text-slate-500">
          Escolha uma senha com pelo menos 8 caracteres. Você precisa informar a senha atual.
        </p>
      </div>

      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      {state.success && <FormMessage type="success">{state.success}</FormMessage>}

      <div>
        <Label htmlFor="current">Senha atual</Label>
        <Input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
      </div>

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
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
        />
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  )
}
