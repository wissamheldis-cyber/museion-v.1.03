'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabaseAuthAdapter } from '@/adapters/auth/SupabaseAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, setProfile } = useMuseionStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const session = supabaseAuthAdapter.getSession()
    if (session) {
      router.replace(searchParams.get('redirectTo') || '/')
    }
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const session = await supabaseAuthAdapter.signInWithEmail(email, password)

    if (!session) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    setAuth(session)
    const profile = supabaseAuthAdapter.getProfile()
    if (profile) setProfile(profile)

    router.replace(searchParams.get('redirectTo') || '/')
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden">
      {/* Fond subtil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,142,240,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm mx-auto px-6">
        {/* Logo */}
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4"
          >
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="vous@studio.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              autoFocus
              autoComplete="email"
              spellCheck={false}
            />

            <Input
              id="password"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
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
              disabled={loading || email.trim() === '' || password.trim() === ''}
            >
              {loading ? 'Connexion…' : 'Entrer'}
            </Button>
          </div>

          <p className="text-center text-xs text-[var(--text-muted)]">
            <Link href="/forgot-password" className="hover:text-[var(--text-secondary)] transition-colors">
              Mot de passe oublié ?
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
