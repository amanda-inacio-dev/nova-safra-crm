'use client'

import { createContext, useContext } from 'react'
import type { UserRole } from '@/types'

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

const UserContext = createContext<CurrentUser | null>(null)

export function UserProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

/** Hook para acessar o usuário logado em qualquer Client Component do dashboard. */
export function useCurrentUser(): CurrentUser {
  const user = useContext(UserContext)
  if (!user) {
    throw new Error('useCurrentUser deve ser usado dentro de <UserProvider>')
  }
  return user
}
