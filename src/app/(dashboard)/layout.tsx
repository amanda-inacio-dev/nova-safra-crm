import { requireUser } from '@/lib/auth/require-role'
import { UserProvider } from '@/components/providers/user-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { LogoutButton } from '@/components/layout/logout-button'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  COMMERCIAL: 'Comercial',
  OPERATION: 'Operação',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser()

  return (
    <UserProvider user={profile}>
      <div className="flex min-h-screen flex-1">
        <Sidebar role={profile.role} />

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <div />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {profile.name || profile.email}
                </p>
                <p className="text-xs text-slate-500">{ROLE_LABEL[profile.role] ?? profile.role}</p>
              </div>
              <LogoutButton />
            </div>
          </header>

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </UserProvider>
  )
}
