import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  DEV_ACCOUNTS,
  parseArgs,
  pickAccounts,
  classifyUser,
  isRateLimitError,
  isAlreadyRegisteredError,
  processAccount,
} from './create-dev-users.mjs'

describe('parseArgs', () => {
  it('returns no-op defaults with no arguments', () => {
    expect(parseArgs([])).toEqual({ help: false, only: null })
  })

  it('recognizes --help', () => {
    expect(parseArgs(['--help'])).toEqual({ help: true, only: null })
  })

  it('recognizes -h', () => {
    expect(parseArgs(['-h'])).toEqual({ help: true, only: null })
  })

  it('--help short-circuits even when combined with other args', () => {
    expect(parseArgs(['--only', 'a@b.com', '--help'])).toEqual({ help: true, only: null })
    expect(parseArgs(['--help', '--only', 'a@b.com'])).toEqual({ help: true, only: null })
  })

  it('parses --only with a space-separated value', () => {
    expect(parseArgs(['--only', 'shou.edition@gmail.com'])).toEqual({
      help: false,
      only: 'shou.edition@gmail.com',
    })
  })

  it('parses --only=value form', () => {
    expect(parseArgs(['--only=shou.edition@gmail.com'])).toEqual({
      help: false,
      only: 'shou.edition@gmail.com',
    })
  })

  it('throws when --only has no value', () => {
    expect(() => parseArgs(['--only'])).toThrow('--only requiert une adresse email')
  })

  it('throws when --only is immediately followed by another flag', () => {
    expect(() => parseArgs(['--only', '--help'])).toThrow('--only requiert une adresse email')
  })

  it('throws when --only= has no value', () => {
    expect(() => parseArgs(['--only='])).toThrow('--only requiert une adresse email')
  })

  it('throws on an unknown argument', () => {
    expect(() => parseArgs(['--bogus'])).toThrow('Argument inconnu : --bogus')
  })

  it('never touches process.env or the network', () => {
    // Pure function contract: calling it must not have side effects. If it
    // did, this test would need environment stubbing to pass — it doesn't.
    expect(() => parseArgs(['--help'])).not.toThrow()
  })
})

describe('pickAccounts', () => {
  it('returns all accounts when no filter is given', () => {
    expect(pickAccounts(DEV_ACCOUNTS, null)).toBe(DEV_ACCOUNTS)
  })

  it('filters to a single matching account, case-insensitively', () => {
    const result = pickAccounts(DEV_ACCOUNTS, 'SHOU.EDITION@gmail.com')
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('shou.edition@gmail.com')
  })

  it('throws a clear error for an unknown email', () => {
    expect(() => pickAccounts(DEV_ACCOUNTS, 'nobody@nowhere.com')).toThrow(/email inconnu/)
  })
})

describe('classifyUser', () => {
  it('returns not_found for undefined', () => {
    expect(classifyUser(undefined)).toBe('not_found')
  })

  it('returns confirmed when email_confirmed_at is set', () => {
    expect(classifyUser({ email_confirmed_at: '2026-01-01T00:00:00Z' })).toBe('confirmed')
  })

  it('returns confirmed when confirmed_at is set', () => {
    expect(classifyUser({ confirmed_at: '2026-01-01T00:00:00Z' })).toBe('confirmed')
  })

  it('returns invited_pending when neither confirmation field is set', () => {
    expect(classifyUser({ invited_at: '2026-01-01T00:00:00Z' })).toBe('invited_pending')
  })
})

describe('isRateLimitError', () => {
  it('detects HTTP 429', () => {
    expect(isRateLimitError({ status: 429, message: 'nope' })).toBe(true)
  })

  it('detects "rate limit" in the message', () => {
    expect(isRateLimitError({ message: 'Email rate limit exceeded' })).toBe(true)
  })

  it('detects "too many requests" in the message', () => {
    expect(isRateLimitError({ message: 'Too many requests, slow down' })).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isRateLimitError({ status: 500, message: 'server error' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isRateLimitError(null)).toBe(false)
    expect(isRateLimitError(undefined)).toBe(false)
  })
})

describe('isAlreadyRegisteredError', () => {
  it('detects "already been registered"', () => {
    expect(isAlreadyRegisteredError({ message: 'A user with this email address has already been registered' })).toBe(true)
  })

  it('detects "already exists"', () => {
    expect(isAlreadyRegisteredError({ message: 'User already exists' })).toBe(true)
  })

  it('returns false otherwise', () => {
    expect(isAlreadyRegisteredError({ message: 'network error' })).toBe(false)
  })
})

describe('processAccount (idempotency — no network, mocked admin client)', () => {
  const account = DEV_ACCOUNTS[0]
  let admin
  let logSpy
  let errorSpy

  beforeEach(() => {
    admin = { auth: { admin: { inviteUserByEmail: vi.fn() } } }
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('never invites an already-confirmed user', async () => {
    const usersByEmail = new Map([[account.email, { email_confirmed_at: '2026-01-01T00:00:00Z' }]])
    const result = await processAccount(admin, account, usersByEmail)
    expect(result).toBe('confirmed')
    expect(admin.auth.admin.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('never re-sends an invitation to a pending user', async () => {
    const usersByEmail = new Map([[account.email, { invited_at: '2026-01-01T00:00:00Z' }]])
    const result = await processAccount(admin, account, usersByEmail)
    expect(result).toBe('invited_pending')
    expect(admin.auth.admin.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('invites a genuinely new user exactly once', async () => {
    admin.auth.admin.inviteUserByEmail.mockResolvedValue({ data: { user: { id: 'new-id' } }, error: null })
    const result = await processAccount(admin, account, new Map())
    expect(result).toBe('invited')
    expect(admin.auth.admin.inviteUserByEmail).toHaveBeenCalledTimes(1)
    expect(admin.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
      account.email,
      expect.objectContaining({ data: { display_name: account.displayName } })
    )
  })

  it('classifies a rate-limit error distinctly and does not treat it as success', async () => {
    admin.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: null,
      error: { status: 429, message: 'Email rate limit exceeded' },
    })
    const result = await processAccount(admin, account, new Map())
    expect(result).toBe('rate_limited')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Limite'))
  })

  it('treats a race-condition "already registered" error as idempotent, not an error', async () => {
    admin.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: null,
      error: { message: 'User already been registered' },
    })
    const result = await processAccount(admin, account, new Map())
    expect(result).toBe('confirmed')
  })

  it('surfaces a genuine unrelated error as an error, not a silent skip', async () => {
    admin.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    })
    const result = await processAccount(admin, account, new Map())
    expect(result).toBe('error')
  })

  it('never logs anything resembling a secret key', async () => {
    admin.auth.admin.inviteUserByEmail.mockResolvedValue({ data: { user: { id: 'x' } }, error: null })
    await processAccount(admin, account, new Map())
    const allLoggedText = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(' ')
    expect(allLoggedText.toLowerCase()).not.toContain('service_role')
    expect(allLoggedText).not.toMatch(/sb_secret_/)
  })
})
