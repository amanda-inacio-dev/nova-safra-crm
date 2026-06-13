import Image from 'next/image'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ClientRow = {
  id: string
  name: string
  contact_name: string | null
  cnpj: string | null
  email: string | null
  phone: string | null
  logo_url: string | null
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRole(['ADMIN', 'COMMERCIAL'])
  const { q } = await searchParams
  const search = (q ?? '').trim()

  const supabase = await createClient()
  let query = supabase
    .from('clients')
    .select('id, name, contact_name, cnpj, email, phone, logo_url')
    .order('name', { ascending: true })

  if (search) {
    query = query.or(`name.ilike.%${search}%,cnpj.ilike.%${search}%`)
  }

  const { data } = await query
  const clients = (data ?? []) as ClientRow[]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="mt-1 text-slate-500">Cadastro e gestão dos clientes da Nova Safra.</p>
        </div>
        <Link href="/clientes/novo">
          <Button>Novo cliente</Button>
        </Link>
      </div>

      <form method="get" className="flex gap-2">
        <Input
          name="q"
          defaultValue={search}
          placeholder="Buscar por razão social ou CNPJ"
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {search && (
          <Link
            href="/clientes"
            className="flex items-center px-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Razão social</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">CNPJ</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  {search
                    ? 'Nenhum cliente encontrado para a busca.'
                    : 'Nenhum cliente cadastrado ainda.'}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {client.logo_url ? (
                      <Image
                        src={client.logo_url}
                        alt={client.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 rounded object-contain"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{client.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{client.contact_name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{client.cnpj ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{client.email ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{client.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clientes/${client.id}/editar`}
                      className="text-brand-700 hover:text-brand-800 text-sm font-medium"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
