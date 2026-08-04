// ============================================================================
// Museion V2.1 — administrative script: create the 3 dev Studio accounts.
//
// Public signup is disabled (see supabase/config.toml: enable_signup = false
// for real usage, kept true locally only for CLI convenience). Accounts are
// created administratively with the Admin API, then invited by email to set
// their own password — this script never chooses or stores a password.
//
// Usage:
//   $env:SUPABASE_URL = "https://qwqyrkifzcpbtzfdctsl.supabase.co"   (or local API_URL)
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<paste only in this shell, never in a file>"
//   node scripts/supabase/create-dev-users.mjs
//
// The service role key is read from the environment only. It is never
// logged, written to a file, or echoed back. Unset the env var when done:
//   Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans cette session de shell uniquement.'
  )
  process.exit(1)
}

const DEV_ACCOUNTS = [
  { email: 'shou.edition@gmail.com', displayName: 'Museion Studio — Admin' },
  { email: 'jimfilmmakerai@gmail.com', displayName: 'Jim Filmmaker Studio — Admin' },
  { email: 'grifz.studio@gmail.com', displayName: 'GRIFZ Studio — Admin' },
]

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

for (const account of DEV_ACCOUNTS) {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(account.email, {
    data: { display_name: account.displayName },
  })

  if (error) {
    if (error.message?.toLowerCase().includes('already been registered')) {
      console.log(`Déjà existant, ignoré : ${account.email}`)
      continue
    }
    console.error(`Échec pour ${account.email} :`, error.message)
    continue
  }

  console.log(`Invitation envoyée à ${account.email} (id ${data.user.id})`)
}

console.log('Terminé. Chaque compte doit valider son invitation pour définir son mot de passe.')
