'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createUser, type UserActionState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { FormMessage } from '@/components/ui/form-message'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Criando…' : 'Criar usuário'}
    </Button>
  )
}

export function NewUserForm() {
  const [state, formAction] = useActionState<UserActionState, FormData>(createUser, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-5"
    >
      <h2 className="text-base font-semibold text-slate-900">Novo usuário</h2>
      <p className="mt-1 text-sm text-slate-500">
        O usuário poderá entrar imediatamente com o e-mail e a senha definidos aqui.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="new-name">Nome</Label>
          <Input id="new-name" name="name" required placeholder="Nome completo" />
        </div>
        <div>
          <Label htmlFor="new-email">E-mail</Label>
          <Input
            id="new-email"
            name="email"
            type="email"
            required
            placeholder="email@empresa.com"
          />
        </div>
        <div>
          <Label htmlFor="new-password">Senha</Label>
          <Input
            id="new-password"
            name="password"
            type="password"
            required
            placeholder="mín. 8 caracteres"
          />
        </div>
        <div>
          <Label htmlFor="new-role">Perfil</Label>
          <Select id="new-role" name="role" defaultValue="COMMERCIAL">
            <option value="ADMIN">Administrador</option>
            <option value="COMMERCIAL">Comercial</option>
            <option value="OPERATION">Operação</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <SubmitButton />
        {state.error && <FormMessage type="error">{state.error}</FormMessage>}
        {state.success && <FormMessage type="success">{state.success}</FormMessage>}
      </div>
    </form>
  )
}
