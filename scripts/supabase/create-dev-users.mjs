#!/usr/bin/env node
// ============================================================================
// Museion V2.1 — administrative script: create the 3 dev Studio accounts.
//
// Public signup is disabled (see supabase/config.toml: enable_signup = false
// for real usage, kept true locally only for CLI convenience). Accounts are
// created administratively with the Admin API, then invited by email to set
// their own password — this script never chooses or stores a password.
//
// Idempotent: existing users (confirmed or already invited) are never
// re-invited. Re-running this script is always safe.
//
// Usage:
//   node scripts/supabase/create-dev-users.mjs [--help] [--only <email>]
//
//   --help          Show this help and exit. Does not read secrets or touch the network.
//   --only <email>  Process a single account instead of all three.
//
// Environment:
//   $env:SUPABASE_URL = "https://qwqyrkifzcpbtzfdctsl.supabase.co"   (or local API_URL)
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<paste only in this shell, never in a file>"
//
// The service role key is read from the environment only. It is never
// logged, written to a file, or echoed back. Unset the env var when done:
//   Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

export const DEV_ACCOUNTS = [
  { email: 'shou.edition@gmail.com', displayName: 'Museion Studio — Admin' },
  { email: 'jimfilmmakerai@gmail.com', displayName: 'Jim Filmmaker Studio — Admin' },
  { email: 'grifz.studio@gmail.com', displayName: 'GRIFZ Studio — Admin' },
]

export const USAGE = `Usage: node scripts/supabase/create-dev-users.mjs [--help] [--only <email>]

  --help          Affiche cette aide et quitte, sans lire de secret ni appeler le réseau.
  --only <email>  Traite un seul compte au lieu des trois.

Variables d'environnement requises (sauf avec --help) :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Comptes gérés :
${DEV_ACCOUNTS.map((a) => `  - ${a.email}`).join('\n')}
`

// ============================================================
// Pure helpers — no I/O, fully unit-testable.
// ============================================================

/**
 * Parses argv (already stripped of `node script.mjs`). Throws a plain Error
 * with a user-facing message on invalid usage; never touches the network or
 * process.env. `--help`/`-h` always short-circuits, even alongside other args.
 */
export function parseArgs(argv) {
  let only = null
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      return { help: true, only: null }
    }
    if (arg === '--only') {
      const value = argv[i + 1]
      if (!value || value.startsWith('-')) {
        throw new Error('--only requiert une adresse email (ex: --only shou.edition@gmail.com)')
      }
      only = value
      i++
      continue
    }
    if (arg.startsWith('--only=')) {
      const value = arg.slice('--only='.length)
      if (!value) {
        throw new Error('--only requiert une adresse email (ex: --only=shou.edition@gmail.com)')
      }
      only = value
      continue
    }
    throw new Error(`Argument inconnu : ${arg}\n\n${USAGE}`)
  }
  return { help: false, only }
}

/** Filters DEV_ACCOUNTS down to a single entry when --only is given. */
export function pickAccounts(accounts, onlyEmail) {
  if (!onlyEmail) return accounts
  const needle = onlyEmail.trim().toLowerCase()
  const match = accounts.filter((a) => a.email.toLowerCase() === needle)
  if (match.length === 0) {
    const known = accounts.map((a) => a.email).join(', ')
    throw new Error(`--only ${onlyEmail} : email inconnu. Comptes gérés par ce script : ${known}`)
  }
  return match
}

/**
 * Classifies an existing Auth user (or absence thereof) so the caller can
 * decide what to do without ever re-sending an invitation.
 * @returns {'not_found' | 'confirmed' | 'invited_pending'}
 */
export function classifyUser(user) {
  if (!user) return 'not_found'
  if (user.email_confirmed_at || user.confirmed_at) return 'confirmed'
  return 'invited_pending'
}

/** Detects Supabase/GoTrue email rate-limit errors specifically. */
export function isRateLimitError(error) {
  if (!error) return false
  if (error.status === 429) return true
  const message = String(error.message ?? '').toLowerCase()
  return message.includes('rate limit') || message.includes('too many requests')
}

/** Detects the (defensive, race-condition) "user already exists" error shape. */
export function isAlreadyRegisteredError(error) {
  const message = String(error?.message ?? '').toLowerCase()
  return message.includes('already been registered') || message.includes('already exists')
}

function buildUsersByEmail(users) {
  const map = new Map()
  for (const user of users) {
    if (user.email) map.set(user.email.toLowerCase(), user)
  }
  return map
}

/**
 * Processes one account against an already-fetched user index. Never calls
 * inviteUserByEmail for an account that already exists in any state — that
 * is the whole point of idempotency here. Returns a status string for the
 * summary and exit-code logic.
 */
export async function processAccount(admin, account, usersByEmail) {
  const existing = usersByEmail.get(account.email.toLowerCase())
  const status = classifyUser(existing)

  if (status === 'confirmed') {
    console.log(`Compte existant et confirmé, ignoré : ${account.email}`)
    return 'confirmed'
  }
  if (status === 'invited_pending') {
    console.log(`Invitation déjà envoyée, en attente de confirmation (aucun renvoi) : ${account.email}`)
    return 'invited_pending'
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(account.email, {
    data: { display_name: account.displayName },
  })

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      console.log(`Déjà existant (détecté pendant l'invitation), ignoré : ${account.email}`)
      return 'confirmed'
    }
    if (isRateLimitError(error)) {
      console.error(`Limite d'envoi d'email atteinte pour ${account.email} — réessayer plus tard avec --only ${account.email}.`)
      return 'rate_limited'
    }
    console.error(`Erreur réelle pour ${account.email} : ${error.message}`)
    return 'error'
  }

  console.log(`Invitation envoyée à ${account.email} (id ${data.user.id})`)
  return 'invited'
}

// ============================================================
// Entry point — only runs when this file is executed directly,
// never when imported by tests.
// ============================================================

async function main() {
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  if (args.help) {
    console.log(USAGE)
    process.exit(0)
  }

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    console.error(
      'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans cette session de shell uniquement.'
    )
    process.exit(1)
  }

  let accounts
  try {
    accounts = pickAccounts(DEV_ACCOUNTS, args.only)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userList, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (listError) {
    console.error(`Impossible de lister les utilisateurs existants : ${listError.message}`)
    process.exit(1)
  }
  const usersByEmail = buildUsersByEmail(userList.users)

  const results = []
  for (const account of accounts) {
    results.push(await processAccount(admin, account, usersByEmail))
  }

  const hadError = results.some((r) => r === 'error' || r === 'rate_limited')
  console.log('Terminé. Chaque compte doit valider son invitation pour définir son mot de passe.')
  process.exit(hadError ? 1 : 0)
}

const { pathToFileURL } = await import('node:url')
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMainModule) {
  main()
}
