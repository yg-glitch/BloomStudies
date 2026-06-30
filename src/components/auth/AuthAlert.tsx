'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface AuthAlertProps {
  type: 'error' | 'success'
  message: string
}

export default function AuthAlert({ type, message }: AuthAlertProps) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <div
      role="alert"
      className={
        isError
          ? 'flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm mb-5 animate-fade-in-down'
          : 'flex items-start gap-2.5 p-3.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm mb-5 animate-fade-in-down'
      }
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  )
}
