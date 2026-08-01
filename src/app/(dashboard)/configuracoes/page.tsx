import { requireUser } from '@/lib/auth/require-role'
import { PasswordForm } from './password-form'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  COMMERCIAL: 'Comercial',
  OPERATION: 'Operação',
}

/**
 * "Minha conta" — configurações do próprio usuário, disponíveis para todo
 * perfil (não é área de administrador). Hoje: troca da própria senha.
 */
export default async function MyAccountPage() {
  const profile = await requireUser()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Minha conta</h1>
        <p className="mt-1 text-slate-500">Seus dados de acesso ao sistema.</p>
      </div>

      <dl className="grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-white p-6 text-sm">
        <dt className="font-medium text-slate-500">Nome</dt>
        <dd className="text-slate-900">{profile.name || '—'}</dd>
        <dt className="font-medium text-slate-500">E-mail</dt>
        <dd className="text-slate-900">{profile.email}</dd>
        <dt className="font-medium text-slate-500">Perfil</dt>
        <dd className="text-slate-900">{ROLE_LABEL[profile.role] ?? profile.role}</dd>
      </dl>

      <PasswordForm />
    </div>
  )
}
