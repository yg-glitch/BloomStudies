'use client'

import type { Provider } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from './supabase/client'
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from './supabase/config'

export interface AuthResult {
  error: string | null
  /** Set when the action requires the user to check their inbox / phone. */
  pendingConfirmation?: boolean
  /** Set when an OAuth redirect has been initiated. */
  redirecting?: boolean
}

function notConfigured(): AuthResult {
  return { error: SUPABASE_NOT_CONFIGURED_MESSAGE }
}

function origin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

/** Friendly mapping for common Supabase auth error messages. */
function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Incorrect email or password.'
  if (m.includes('email not confirmed')) return 'Please verify your email before signing in.'
  if (m.includes('user already registered')) return 'An account with this email already exists.'
  if (m.includes('password should be at least')) return 'Password is too short — use at least 8 characters.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  return message
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: `${origin()}/auth/callback`,
    },
  })
  if (error) return { error: friendly(error.message) }

  // When email confirmation is enabled, no session is returned immediately.
  const pendingConfirmation = !data.session
  return { error: null, pendingConfirmation }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: friendly(error.message) }
  return { error: null }
}

export async function signOut(): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.signOut()
  if (error) return { error: friendly(error.message) }
  return { error: null }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin()}/auth/reset-password`,
  })
  if (error) return { error: friendly(error.message) }
  return { error: null, pendingConfirmation: true }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: friendly(error.message) }
  return { error: null }
}

export async function updateProfile(metadata: Record<string, unknown>): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.updateUser({ data: metadata })
  if (error) return { error: friendly(error.message) }
  return { error: null }
}

export async function sendMagicLink(email: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin()}/auth/callback` },
  })
  if (error) return { error: friendly(error.message) }
  return { error: null, pendingConfirmation: true }
}

export async function resendVerification(email: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${origin()}/auth/callback` },
  })
  if (error) return { error: friendly(error.message) }
  return { error: null, pendingConfirmation: true }
}

export async function sendPhoneOtp(phone: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.signInWithOtp({ phone })
  if (error) return { error: friendly(error.message) }
  return { error: null, pendingConfirmation: true }
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) return { error: friendly(error.message) }
  return { error: null }
}

/** Maps a UI provider name to a Supabase OAuth provider id. */
const OAUTH_PROVIDERS: Record<'google' | 'apple' | 'microsoft', Provider> = {
  google: 'google',
  apple: 'apple',
  microsoft: 'azure',
}

export async function signInWithProvider(
  provider: 'google' | 'apple' | 'microsoft',
  redirectedFrom?: string
): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return notConfigured()

  const next = redirectedFrom && redirectedFrom.startsWith('/dashboard') ? redirectedFrom : '/dashboard'
  const { error } = await supabase.auth.signInWithOAuth({
    provider: OAUTH_PROVIDERS[provider],
    options: {
      redirectTo: `${origin()}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: provider === 'microsoft' ? 'email openid profile' : undefined,
    },
  })
  if (error) return { error: friendly(error.message) }
  return { error: null, redirecting: true }
}
