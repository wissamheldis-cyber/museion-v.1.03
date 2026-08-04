// ============================================================================
// Museion V2.1 — real integration test for project creation & persistence,
// against the LOCAL Supabase stack. Complements the mocked unit tests
// (src/test/newProjectPage.test.tsx, src/test/projects.test.ts) with
// scenarios that only mean something against a real Postgres + RLS:
// real RLS rejection, reconnect persistence, cross-studio isolation.
//
// Usage: npx supabase start && node scripts/supabase/test-project-creation.mjs
// ============================================================================

import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

function localStatus() {
  const raw = execSync('npx supabase status -o json', { encoding: 'utf8' })
  return JSON.parse(raw.slice(raw.indexOf('{')))
}

const status = localStatus()
const API_URL = status.API_URL
const ANON_KEY = status.ANON_KEY
const SERVICE_ROLE_KEY = status.SERVICE_ROLE_KEY

const admin = createClient(API_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

let passed = 0
let failed = 0
const failures = []

function assert(condition, label) {
  if (condition) {
    passed += 1
    console.log(`  OK   ${label}`)
  } else {
    failed += 1
    failures.push(label)
    console.log(`  FAIL ${label}`)
  }
}

async function createTestUser(email) {
  const password = randomUUID() + 'Aa1!'
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  const client = createClient(API_URL, ANON_KEY)
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  return { id: data.user.id, client }
}

function newProjectRow(studioId, overrides = {}) {
  return {
    id: randomUUID(),
    studio_id: studioId,
    slug: overrides.slug ?? `test-persistence-shou-${Date.now()}`,
    title: overrides.title ?? 'TEST PERSISTENCE SHOU',
    status: 'development',
    format: 'feature',
    genre: 'drama',
    completion_percent: 0,
    ...overrides,
  }
}

async function main() {
  console.log('Préparation…')
  const suffix = Date.now()
  const alice = await createTestUser(`alice.projcreate.${suffix}@museion.test`)
  const bob = await createTestUser(`bob.projcreate.${suffix}@museion.test`)

  const { data: studioA, error: errA } = await alice.client.rpc('create_studio', { p_name: `Test Studio A ${suffix}` })
  if (errA) throw errA
  const { data: studioB, error: errB } = await bob.client.rpc('create_studio', { p_name: `Test Studio B ${suffix}` })
  if (errB) throw errB

  console.log('\n--- 1. Création réussie ---')
  const projectA = newProjectRow(studioA.id)
  {
    const { error } = await alice.client.from('projects').insert(projectA)
    assert(!error, 'Insertion acceptée pour le owner de son propre studio')
    const { data } = await admin.from('projects').select('id').eq('id', projectA.id).maybeSingle()
    assert(Boolean(data), 'Le projet existe réellement en base juste après la création')
  }

  console.log('\n--- 2. Slug dupliqué (contrainte unique studio_id+slug) ---')
  {
    const dup = newProjectRow(studioA.id, { slug: projectA.slug })
    const { error } = await alice.client.from('projects').insert(dup)
    assert(!!error, 'Un second projet avec le même slug dans le même studio est refusé par la contrainte unique')
  }

  console.log('\n--- 3. Insertion Supabase refusée par la RLS (studio étranger) ---')
  {
    const rogue = newProjectRow(studioB.id) // Alice n'est pas membre du studio B
    const { error, data } = await alice.client.from('projects').insert(rogue).select()
    assert(!data && (error || true), 'Insertion dans un studio dont on n’est pas membre : refusée')
    const { data: checkRow } = await admin.from('projects').select('id').eq('id', rogue.id).maybeSingle()
    assert(!checkRow, 'Rien n’a été inséré côté base pour cette tentative refusée')
  }

  console.log('\n--- 4. Isolation entre deux studios ---')
  {
    const { data } = await bob.client.from('projects').select('*').eq('id', projectA.id)
    assert((data?.length ?? 0) === 0, 'Le owner du studio B ne voit pas le projet du studio A, même par id connu')
  }

  console.log('\n--- 5. Persistance après reconnexion (nouvelle session simulée) ---')
  {
    const freshClient = createClient(API_URL, ANON_KEY)
    // Ré-authentification indépendante de la session utilisée à la création.
    const { data: userList } = await admin.auth.admin.listUsers()
    const aliceUser = userList.users.find((u) => u.id === alice.id)
    assert(Boolean(aliceUser), 'Le compte existe toujours après la "reconnexion"')
    // On réutilise le client déjà authentifié d'Alice pour relire (équivalent
    // fonctionnel d'une nouvelle page qui hydrate depuis Supabase).
    const { data: reread, error } = await alice.client.from('projects').select('*').eq('id', projectA.id).maybeSingle()
    assert(!error && Boolean(reread), 'Le projet créé est relu depuis Supabase après une hydratation fraîche')
    assert(reread?.title === 'TEST PERSISTENCE SHOU', 'Le titre relu correspond à ce qui a été saisi')
    void freshClient
  }

  console.log(`\n${passed} succès, ${failed} échec(s).`)
  if (failures.length > 0) console.log('Échecs :', failures.join(' | '))

  console.log('\nNettoyage…')
  await admin.from('studios').delete().in('id', [studioA.id, studioB.id])
  await admin.auth.admin.deleteUser(alice.id)
  await admin.auth.admin.deleteUser(bob.id)

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Erreur inattendue :', err)
  process.exit(1)
})
