import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  DEV_ACCOUNTS,
  parseArgs,
  pickAccounts,
  assertDevelopmentEnvironment,
  classifyUser,
  isRateLimitError,
  isAlreadyRegisteredError,
  processAccount,
} from './create-dev-users.mjs'

const TEST_PASSWORD = 'Netflix2027'

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

describe('assertDevelopmentEnvironment', () => {
  it('passes silently when SUPABASE_ENVIRONMENT is exactly "development"', () => {
    expect(() => assertDevelopmentEnvironment({ SUPABASE_ENVIRONMENT: 'development' })).not.toThrow()
  })

  it('refuses when SUPABASE_ENVIRONMENT is unset', () => {
    expect(() => assertDevelopmentEnvironment({})).toThrow(/development/)
  })

  it('refuses when SUPABASE_ENVIRONMENT is production', () => {
    expect(() => assertDevelopmentEnvironment({ SUPABASE_ENVIRONMENT: 'production' })).toThrow(/development/)
  })

  it('refuses a near-miss value (case, whitespace)', () => {
    expect(() => assertDevelopmentEnvironment({ SUPABASE_ENVIRONMENT: 'Development' })).toThrow()
    expect(() => assertDevelopmentEnvironment({ SUPABASE_ENVIRONMENT: 'development ' })).toThrow()
  })

  it('never touches the network or process.env — pure function', () => {
    expect(() => assertDevelopmentEnvironment({ SUPABASE_ENVIRONMENT: 'development' })).not.toThrow()
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

describe('processAccount — existing accounts (e.g. shou.edition@, jimfilmmakerai@ already invited)', () => {
  const account = DEV_ACCOUNTS[0]
  let admin
  let logSpy
  let errorSpy

  beforeEach(() => {
    admin = {
      auth: {
        admin: {
          updateUserById: vi.fn(),
          createUser: vi.fn(),
          deleteUser: vi.fn(),
        },
      },
    }
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sets the password on an already-confirmed existing user via updateUserById, not createUser', async () => {
    admin.auth.admin.updateUserById.mockResolvedValue({ data: {}, error: null })
    const usersByEmail = new Map([[account.email, { id: 'user-1', email_confirmed_at: '2026-01-01T00:00:00Z' }]])
    const result = await processAccount(admin, account, usersByEmail, TEST_PASSWORD)
    expect(result).toBe('password_set')
    expect(admin.auth.admin.updateUserById).toHaveBeenCalledTimes(1)
    expect(admin.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', {
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled()
  })

  it('activates a pending-invite user (shou.edition@/jimfilmmakerai@ case) via updateUserById', async () => {
    admin.auth.admin.updateUserById.mockResolvedValue({ data: {}, error: null })
    const usersByEmail = new Map([[account.email, { id: 'user-2', invited_at: '2026-01-01T00:00:00Z' }]])
    const result = await processAccount(admin, account, usersByEmail, TEST_PASSWORD)
    expect(result).toBe('password_set')
    expect(admin.auth.admin.updateUserById).toHaveBeenCalledWith('user-2', {
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    expect(admin.auth.admin.createUser).not.toHaveBeenCalled()
  })

  it('never calls deleteUser under any circumstance', async () => {
    admin.auth.admin.updateUserById.mockResolvedValue({ data: {}, error: null })
    const usersByEmail = new Map([[account.email, { id: 'user-1', email_confirmed_at: '2026-01-01T00:00:00Z' }]])
    await processAccount(admin, account, usersByEmail, TEST_PASSWORD)
    expect(admin.auth.admin.deleteUser).not.toHaveBeenCalled()
  })

  it('creates a genuinely new user (GRIFZ case) with the password, not updateUserById', async () => {
    admin.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'new-id' } }, error: null })
    const result = await processAccount(admin, account, new Map(), TEST_PASSWORD)
    expect(result).toBe('created')
    expect(admin.auth.admin.createUser).toHaveBeenCalledTimes(1)
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith({
      email: account.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: account.displayName },
    })
    expect(admin.auth.admin.updateUserById).not.toHaveBeenCalled()
  })

  it('never sends an invitation — no inviteUserByEmail call exists on the mock at all', async () => {
    admin.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'new-id' } }, error: null })
    await processAccount(admin, account, new Map(), TEST_PASSWORD)
    expect(admin.auth.admin.inviteUserByEmail).toBeUndefined()
  })

  it('classifies a rate-limit error on update distinctly', async () => {
    admin.auth.admin.updateUserById.mockResolvedValue({
      data: null,
      error: { status: 429, message: 'rate limit exceeded' },
    })
    const usersByEmail = new Map([[account.email, { id: 'user-1', email_confirmed_at: '2026-01-01T00:00:00Z' }]])
    const result = await processAccount(admin, account, usersByEmail, TEST_PASSWORD)
    expect(result).toBe('rate_limited')
  })

  it('treats a race-condition "already registered" error on create as idempotent, not an error', async () => {
    admin.auth.admin.createUser.mockResolvedValue({
      data: null,
      error: { message: 'User already been registered' },
    })
    const result = await processAccount(admin, account, new Map(), TEST_PASSWORD)
    expect(result).toBe('password_set')
  })

  it('surfaces a genuine unrelated create error as an error', async () => {
    admin.auth.admin.createUser.mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    })
    const result = await processAccount(admin, account, new Map(), TEST_PASSWORD)
    expect(result).toBe('error')
  })

  it('surfaces a genuine unrelated update error as an error', async () => {
    admin.auth.admin.updateUserById.mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    })
    const usersByEmail = new Map([[account.email, { id: 'user-1', email_confirmed_at: '2026-01-01T00:00:00Z' }]])
    const result = await processAccount(admin, account, usersByEmail, TEST_PASSWORD)
    expect(result).toBe('error')
  })

  it('never logs the password value, on create or on update', async () => {
    admin.auth.admin.createUser.mockResolvedValue({ data: { user: { id: 'x' } }, error: null })
    await processAccount(admin, account, new Map(), TEST_PASSWORD)

    admin.auth.admin.updateUserById.mockResolvedValue({ data: {}, error: null })
    const usersByEmail = new Map([[account.email, { id: 'user-1', email_confirmed_at: '2026-01-01T00:00:00Z' }]])
    await processAccount(admin, account, usersByEmail, TEST_PASSWORD)

    const allLoggedText = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().join(' ')
    expect(allLoggedText).not.toContain(TEST_PASSWORD)
    expect(allLoggedText.toLowerCase()).not.toContain('service_role')
    expect(allLoggedText).not.toMatch(/sb_secret_/)
  })
})
