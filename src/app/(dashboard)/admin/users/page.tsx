import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { NewUserForm } from './new-user-form'
import { UserRow, type UserRowData } from './user-row'

export default async function AdminUsersPage() {
  const currentUser = await requireRole(['ADMIN'])

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('id, name, email, role, active')
    .order('created_at', { ascending: true })

  const users = (data ?? []) as UserRowData[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Usuários</h1>
        <p className="mt-1 text-slate-500">Crie e gerencie os usuários do sistema e seus perfis.</p>
      </div>

      <NewUserForm />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-3">Nome / E-mail / Perfil</th>
              <th className="px-4 py-3">Senha</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow key={user.id} user={user} isSelf={user.id === currentUser.id} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
