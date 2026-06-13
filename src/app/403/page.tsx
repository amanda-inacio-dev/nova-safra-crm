import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="text-brand-700 text-5xl font-bold">403</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Acesso negado</h1>
      <p className="mt-2 max-w-sm text-slate-500">
        Você não tem permissão para acessar esta página com o seu perfil de usuário.
      </p>
      <Link
        href="/"
        className="bg-brand-800 hover:bg-brand-700 mt-6 rounded-md px-4 py-2 text-sm font-medium text-white"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
