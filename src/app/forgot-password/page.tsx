'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabaseAuthAdapter } from '@/adapters/auth/SupabaseAuthAdapter'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await supabaseAuthAdapter.requestPasswordReset(email)
      setSent(true)
    } catch {
      setError("Impossible d'envoyer l'email pour le moment. Réessaie dans quelques minutes.")
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
              src="/brand/museion-mark.png"
              alt="Museion"
              fill
              sizes="384px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {sent ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4 text-center">
            <p className="text-sm text-[var(--text-primary)]">
              Si un compte existe pour cette adresse, un email de réinitialisation vient d&apos;être envoyé.
            </p>
            <Link href="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Indiquez votre email pour recevoir un lien de réinitialisation.
              </p>
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="vous@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
                spellCheck={false}
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
                disabled={loading || email.trim() === ''}
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
            </div>
            <p className="text-center text-xs text-[var(--text-muted)]">
              <Link href="/login" className="hover:text-[var(--text-secondary)] transition-colors">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
