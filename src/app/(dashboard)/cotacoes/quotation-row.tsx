'use client'

import { useRouter } from 'next/navigation'

export function QuotationRow({
  id,
  children,
  target = 'editar',
}: {
  id: string
  children: React.ReactNode
  /** Operação não edita cotação — clicar na linha leva direto pra tela de revisão. */
  target?: 'editar' | 'revisar'
}) {
  const router = useRouter()

  return (
    <tr
      onClick={() => router.push(`/cotacoes/${id}/${target}`)}
      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
    >
      {children}
    </tr>
  )
}
