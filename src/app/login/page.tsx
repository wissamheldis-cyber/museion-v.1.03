'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { localAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'
import { useMuseionStore } from '@/store/museionStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, setProfile } = useMuseionStore()
  const [profileName, setProfileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const session = localAuthAdapter.getSession()
    if (session) {
      router.replace('/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const session = await localAuthAdapter.signIn(profileName)

    if (!session) {
      setError('Profil inconnu. Essayez « administrateur ».')
      setLoading(false)
      return
    }

    setAuth(session)
    const profile = localAuthAdapter.getProfile()
    if (profile) setProfile(profile)

    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center relative overflow-hidden">
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
          <div className="w-20 h-20 mb-6 relative">
            <Image
              src="/brand/museion-logo.png"
              alt="Museion"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-[0.18em] text-[var(--text-primary)] uppercase">
            Museion
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)] tracking-wide">
            Studio créatif
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4"
          >
            <Input
              id="profile"
              label="Profil"
              placeholder="administrateur"
              value={profileName}
              onChange={(e) => {
                setProfileName(e.target.value)
                setError('')
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sm)] px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-1"
              disabled={loading || profileName.trim() === ''}
            >
              {loading ? 'Connexion…' : 'Entrer'}
            </Button>
          </div>

          <p className="text-center text-xs text-[var(--text-muted)]">
            Version 1 — Accès local uniquement
          </p>
        </form>
      </div>
    </div>
  )
}
