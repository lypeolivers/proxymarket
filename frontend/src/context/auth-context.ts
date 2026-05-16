import { createContext, useContext } from 'react'
import type { TSigninResponse } from '@/models/auth.model'

export type AuthSession = TSigninResponse & {
  id: number
}

export type AuthContextValue = {
  auth: AuthSession | null
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loadSessionFromStorage: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
