'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types'

type NavItem = {
  label: string
  href: string
  roles?: UserRole[] // se omitido, visível para todos
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Usuários', href: '/admin/users', roles: ['ADMIN'] },
]

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()

  const items = NAV.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <aside className="bg-brand-900 flex w-60 shrink-0 flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="rounded-md bg-white p-1.5">
          <Image
            src="/assets/logo-nova-safra.jpeg"
            alt="Nova Safra"
            width={120}
            height={40}
            className="h-7 w-auto"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-700 text-white'
                  : 'text-brand-100 hover:bg-brand-800 hover:text-white'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
