'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { signOut as signOutApi } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  /** Whether real Supabase auth is wired up. */
  authEnabled: boolean
  /** Convenience display name derived from the user profile. */
  displayName: string | null
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const authEnabled = isSupabaseConfigured()

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    setUser(data.session?.user ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    refresh()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [refresh])

  const handleSignOut = useCallback(async () => {
    await signOutApi()
    setSession(null)
    setUser(null)
  }, [])

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    user?.phone ??
    null

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authEnabled,
        displayName,
        signOut: handleSignOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
