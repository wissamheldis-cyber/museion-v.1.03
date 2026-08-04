'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabaseAuthAdapter } from '@/adapters/auth/SupabaseAuthAdapter'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // The recovery link puts the user in a temporary session; give the
    // Supabase client a moment to parse the URL fragment before deciding
    // whether the link is valid.
    const timeout = setTimeout(() => {
      setReady(supabaseAuthAdapter.getSession() !== null)
    }, 400)
    return () => clearTimeout(timeout)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await supabaseAuthAdapter.updatePassword(password)
      setDone(true)
      setTimeout(() => router.replace('/'), 1500)
    } catch {
      setError('Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,142,240,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm mx-auto px-6">
        <div className="flex flex-col items-center mb-10">
          <div className="w-96 h-96 relative">
            <Image
              src="/brand/logo museion.png"
              alt="Museion"
              fill
              sizes="384px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {done ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center">
            <p className="text-sm text-[var(--text-primary)]">Mot de passe mis à jour. Redirection…</p>
          </div>
        ) : !ready ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4 text-center">
            <p className="text-sm text-[var(--text-secondary)]">Lien invalide ou expiré.</p>
            <Link href="/forgot-password" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4">
              <Input
                id="password"
                type="password"
                label="Nouveau mot de passe"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                autoFocus
                autoComplete="new-password"
              />
              <Input
                id="confirmPassword"
                type="password"
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setError('')
                }}
                autoComplete="new-password"
              />

              {error && (
                <p className="text-xs text-[var(--state-danger)] bg-[var(--state-danger-dim)] border border-[var(--state-danger)]/25 rounded-[var(--radius-sm)] px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-1"
                disabled={loading || password.trim() === '' || confirmPassword.trim() === ''}
              >
                {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
