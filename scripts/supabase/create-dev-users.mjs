#!/usr/bin/env node
// ============================================================================
// Museion V2.1 — administrative script: create/activate the 3 dev Studio
// accounts with a known development password.
//
// This only ever runs against SUPABASE_ENVIRONMENT=development — it sets a
// real password via the Admin API (no email round-trip, no invitation sent).
// Two of the three accounts already exist as pending invites from an earlier
// run; this script finds them by email and sets their password instead of
// creating a duplicate or re-inviting them. It never deletes a user.
//
// Idempotent and safe to re-run: existing accounts get their password
// (re)set via updateUserById, accounts that don't exist yet get created via
// createUser — either way, at most one Admin API call per account per run.
//
// Usage:
//   node scripts/supabase/create-dev-users.mjs [--help] [--only <email>]
//
//   --help          Show this help and exit. Does not read secrets or touch the network.
//   --only <email>  Process a single account instead of all three.
//
// Environment (all required, except with --help):
//   $env:SUPABASE_URL = "https://qwqyrkifzcpbtzfdctsl.supabase.co"   (or local API_URL)
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<paste only in this shell, never in a file>"
//   $env:SUPABASE_ENVIRONMENT = "development"
//   $env:DEV_USER_PASSWORD = "<paste only in this shell, never in a file>"
//
// SUPABASE_ENVIRONMENT must be exactly "development" — this script refuses
// to run against anything else, so it can never reset a real password on a
// non-development project by accident.
//
// The service role key and the dev password are read from the environment
// only. Neither is ever logged, written to a file, or echoed back. Unset
// them when done:
//   Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
//   Remove-Item Env:\DEV_USER_PASSWORD
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
  SUPABASE_ENVIRONMENT     doit valoir exactement "development"
  DEV_USER_PASSWORD        mot de passe appliqué aux comptes ci-dessous

Comptes gérés :
${DEV_ACCOUNTS.map((a) => `  - ${a.email}`).join('\n')}

Ne renvoie jamais d'email d'invitation, ne supprime jamais de compte.
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
 * Refuses to proceed unless SUPABASE_ENVIRONMENT is exactly "development".
 * This is the hard safety gate against ever resetting a password on a
 * non-development project. Pure — takes an env-like object, never reads
 * process.env itself, so it's directly unit-testable.
 */
export function assertDevelopmentEnvironment(env) {
  const value = env.SUPABASE_ENVIRONMENT
  if (value !== 'development') {
    throw new Error(
      `SUPABASE_ENVIRONMENT doit valoir exactement "development" pour utiliser ce script ` +
        `(valeur actuelle : ${value ? JSON.stringify(value) : '(non définie)'}).`
    )
  }
}

/**
 * Classifies an existing Auth user (or absence thereof). Used for logging
 * and for deciding create vs. update — never for skipping an account.
 * @returns {'not_found' | 'confirmed' | 'invited_pending'}
 */
export function classifyUser(user) {
  if (!user) return 'not_found'
  if (user.email_confirmed_at || user.confirmed_at) return 'confirmed'
  return 'invited_pending'
}

/** Detects Supabase/GoTrue rate-limit errors. */
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
 * Processes one account against an already-fetched user index. Existing
 * accounts (any state) get their password set via updateUserById; accounts
 * that don't exist yet get created via createUser with that same password.
 * No email is ever sent by either path. Never deletes anything. Returns a
 * status string for the summary and exit-code logic.
 */
export async function processAccount(admin, account, usersByEmail, password) {
  const existing = usersByEmail.get(account.email.toLowerCase())
  const priorStatus = classifyUser(existing)

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    })
    if (error) {
      if (isRateLimitError(error)) {
        console.error(`Limite atteinte pour ${account.email} — réessayer plus tard avec --only ${account.email}.`)
        return 'rate_limited'
      }
      console.error(`Erreur réelle pour ${account.email} : ${error.message}`)
      return 'error'
    }
    const origin = priorStatus === 'invited_pending' ? 'invitation en attente activée' : 'compte existant'
    console.log(`Mot de passe défini (${origin}) : ${account.email}`)
    return 'password_set'
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { display_name: account.displayName },
  })

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      console.log(`Déjà existant (détecté pendant la création), ignoré : ${account.email}`)
      return 'password_set'
    }
    if (isRateLimitError(error)) {
      console.error(`Limite atteinte pour ${account.email} — réessayer plus tard avec --only ${account.email}.`)
      return 'rate_limited'
    }
    console.error(`Erreur réelle pour ${account.email} : ${error.message}`)
    return 'error'
  }

  console.log(`Compte créé avec le mot de passe de développement : ${account.email} (id ${data.user.id})`)
  return 'created'
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
  const devPassword = process.env.DEV_USER_PASSWORD
  if (!url || !serviceRoleKey) {
    console.error(
      'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans cette session de shell uniquement.'
    )
    process.exit(1)
  }
  if (!devPassword) {
    console.error('DEV_USER_PASSWORD doit être défini dans cette session de shell uniquement.')
    process.exit(1)
  }

  try {
    assertDevelopmentEnvironment(process.env)
  } catch (err) {
    console.error(err.message)
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
    results.push(await processAccount(admin, account, usersByEmail, devPassword))
  }

  const hadError = results.some((r) => r === 'error' || r === 'rate_limited')
  console.log('Terminé.')
  process.exit(hadError ? 1 : 0)
}

const { pathToFileURL } = await import('node:url')
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMainModule) {
  main()
}
