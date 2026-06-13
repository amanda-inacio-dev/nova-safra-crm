import { requireUser } from '@/lib/auth/require-role'

export default async function DashboardHome() {
  const profile = await requireUser()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Bem-vindo, {profile.name || profile.email}
      </h1>
      <p className="mt-2 text-slate-500">
        Este é o painel da Nova Safra. As métricas e gráficos serão adicionados na etapa do
        Dashboard.
      </p>
    </div>
  )
}
