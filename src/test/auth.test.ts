import { describe, it, expect, beforeEach } from 'vitest'
import { LocalAuthAdapter } from '@/adapters/auth/LocalAuthAdapter'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('LocalAuthAdapter', () => {
  let adapter: LocalAuthAdapter

  beforeEach(() => {
    localStorageMock.clear()
    adapter = new LocalAuthAdapter()
  })

  it('accepts "administrateur"', async () => {
    const session = await adapter.signIn('administrateur')
    expect(session).not.toBeNull()
    expect(session?.displayName).toBe('Administrateur')
  })

  it('accepts "administrateur" case-insensitive', async () => {
    const session = await adapter.signIn('Administrateur')
    expect(session).not.toBeNull()
  })

  it('rejects unknown profiles', async () => {
    const session = await adapter.signIn('jim')
    expect(session).toBeNull()
  })

  it('rejects empty string', async () => {
    const session = await adapter.signIn('')
    expect(session).toBeNull()
  })

  it('persists session after signIn', async () => {
    await adapter.signIn('administrateur')
    const session = adapter.getSession()
    expect(session).not.toBeNull()
    expect(session?.displayName).toBe('Administrateur')
  })

  it('clears session after signOut', async () => {
    await adapter.signIn('administrateur')
    await adapter.signOut()
    const session = adapter.getSession()
    expect(session).toBeNull()
  })

  it('returns null session when not signed in', () => {
    const session = adapter.getSession()
    expect(session).toBeNull()
  })

  it('returns profile when signed in', async () => {
    await adapter.signIn('administrateur')
    const profile = adapter.getProfile()
    expect(profile).not.toBeNull()
    expect(profile?.displayName).toBe('Administrateur')
    expect(profile?.role).toBe('administrator')
  })
})
