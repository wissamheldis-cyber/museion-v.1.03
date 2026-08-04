// ============================================================================
// Museion V2.1 — real RLS regression test against the LOCAL Supabase stack.
//
// This creates disposable test users/studios/projects, exercises Postgres
// RLS as each authenticated role would see it (not as the service role,
// which bypasses RLS entirely), asserts both positive and negative access,
// then deletes everything it created. Requires `npx supabase start` first.
//
// Usage: node scripts/supabase/test-rls.mjs
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

const admin = createClient(API_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

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
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  const client = createClient(API_URL, ANON_KEY)
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  return { id: data.user.id, client }
}

async function main() {
  console.log('Préparation des comptes de test…')
  const suffix = Date.now()
  const alice = await createTestUser(`alice.${suffix}@museion.test`)
  const bob = await createTestUser(`bob.${suffix}@museion.test`)
  const carol = await createTestUser(`carol.${suffix}@museion.test`)
  const stranger = createClient(API_URL, ANON_KEY) // no session at all

  console.log('Création des studios de test (via RPC create_studio, comme owner)…')
  const { data: studioA, error: errA } = await alice.client.rpc('create_studio', {
    p_name: `RLS Test Studio A ${suffix}`,
  })
  if (errA) throw errA
  const { data: studioB, error: errB } = await bob.client.rpc('create_studio', {
    p_name: `RLS Test Studio B ${suffix}`,
  })
  if (errB) throw errB

  const { data: projectA, error: projectAError } = await alice.client
    .from('projects')
    .insert({
      studio_id: studioA.id,
      slug: 'projet-a',
      title: 'Projet A',
      status: 'draft',
      format: 'short',
      genre: 'drama',
    })
    .select()
    .single()
  if (projectAError) console.error('projectA insert error', projectAError)

  console.log('\n--- Isolation studio à studio ---')
  {
    const { data } = await alice.client.from('projects').select('*').eq('id', projectA.id)
    assert(data?.length === 1, "Alice (owner de A) voit le projet de son propre studio")
  }
  {
    const { data } = await bob.client.from('projects').select('*').eq('id', projectA.id)
    assert((data?.length ?? 0) === 0, "Bob (owner de B) ne voit PAS le projet du studio A, même par UUID connu")
  }
  {
    const { data } = await bob.client.from('studios').select('*').eq('id', studioA.id)
    assert((data?.length ?? 0) === 0, "Bob ne voit pas le studio A lui-même")
  }
  {
    const { error } = await bob.client
      .from('projects')
      .insert({
        studio_id: studioA.id,
        slug: 'intrusion',
        title: 'Intrusion',
        status: 'draft',
        format: 'short',
        genre: 'drama',
      })
    assert(!!error, "Bob ne peut pas créer un projet dans le studio A (non membre)")
  }
  {
    const { data, error } = await stranger.from('projects').select('*')
    assert(!error ? (data?.length ?? 0) === 0 : true, "Un client anonyme sans session ne voit aucun projet")
  }

  console.log('\n--- Storage privé (avant que Bob/Carol ne rejoignent le studio A) ---')
  {
    const { data: buckets } = await admin.storage.listBuckets()
    const allPrivate = buckets.every((b) => b.public === false)
    assert(allPrivate, 'Tous les buckets sont privés (public=false)')
  }
  {
    const path = `${studioA.id}/${projectA.id}/references/test.txt`
    const { error } = await alice.client.storage
      .from('project-references')
      .upload(path, new Blob(['contenu de test']), { contentType: 'text/plain' })
    assert(!error, "Alice peut téléverser dans son propre studio (project-references)")
  }
  {
    const path = `${studioA.id}/${projectA.id}/references/test.txt`
    const { data, error } = await bob.client.storage.from('project-references').download(path)
    assert(!data && !!error, "Bob (pas encore membre du studio A) ne peut pas télécharger un fichier du studio A")
  }
  {
    const path = `${studioB.id}/rogue/references/test.txt`
    const { error } = await alice.client.storage
      .from('project-references')
      .upload(path, new Blob(['intrusion']), { contentType: 'text/plain' })
    assert(!!error, "Alice ne peut pas téléverser dans le studio B (non membre)")
  }

  console.log('\n--- Rôles au sein du même studio (A) ---')
  // Carol joins studio A as reviewer, Bob joins studio A as creator — both via
  // the service role, simulating an owner/admin having already added them
  // (studio_members INSERT itself is admin-only, tested separately below).
  const carolJoin = await admin.from('studio_members').insert({ studio_id: studioA.id, user_id: carol.id, role: 'reviewer' })
  if (carolJoin.error) console.error('carolJoin error', carolJoin.error)
  const bobJoin = await admin.from('studio_members').insert({ studio_id: studioA.id, user_id: bob.id, role: 'creator' })
  if (bobJoin.error) console.error('bobJoin error', bobJoin.error)

  {
    const { data } = await carol.client.from('projects').select('*').eq('id', projectA.id)
    assert(data?.length === 1, "Carol (reviewer sur A) peut lire le projet")
  }
  {
    const { error } = await carol.client
      .from('provider_connection_metadata')
      .insert({ studio_id: studioA.id, provider: 'test-provider', is_connected: false })
    assert(!!error, "Carol (reviewer) ne peut pas gérer les providers du studio")
  }
  {
    const { error } = await carol.client
      .from('projects')
      .update({ title: 'Modifié par reviewer' })
      .eq('id', projectA.id)
    const { data: check, error: checkError } = await admin.from('projects').select('title').eq('id', projectA.id).single()
    if (checkError) console.error('checkError', checkError, 'projectA.id was', projectA.id)
    assert(!!check && check.title !== 'Modifié par reviewer', "Carol (reviewer) ne peut pas modifier le projet")
    void error
  }
  {
    const { data, error } = await bob.client
      .from('projects')
      .insert({
        studio_id: studioA.id,
        slug: 'projet-b-par-creator',
        title: 'Projet par creator',
        status: 'draft',
        format: 'short',
        genre: 'drama',
      })
      .select()
      .single()
    assert(!error && !!data, "Bob (creator sur A) peut créer un projet dans le studio A")
  }
  {
    const { error } = await bob.client
      .from('studio_members')
      .insert({ studio_id: studioA.id, user_id: randomUUID(), role: 'creator' })
    assert(!!error, "Bob (creator) ne peut pas ajouter de membres (réservé owner/admin)")
  }
  {
    const { error } = await bob.client.from('studios').delete().eq('id', studioA.id)
    const { data: stillThere } = await admin.from('studios').select('id').eq('id', studioA.id).single()
    assert(!!stillThere, "Bob (creator) ne peut pas supprimer le studio (réservé owner)")
    void error
  }

  console.log('\n--- Protection du dernier owner ---')
  {
    const { data: aliceMembership } = await admin
      .from('studio_members')
      .select('id')
      .eq('studio_id', studioA.id)
      .eq('user_id', alice.id)
      .single()
    const { error } = await admin.from('studio_members').delete().eq('id', aliceMembership.id)
    assert(!!error, "Impossible de retirer le dernier owner du studio, même via le service role")
  }

  {
    const path = `${studioA.id}/${projectA.id}/references/test.txt`
    const { data, error } = await carol.client.storage.from('project-references').download(path)
    assert(!!data && !error, "Carol (reviewer sur A, après y avoir été ajoutée) peut télécharger un fichier du studio A")
  }

  console.log(`\n${passed} succès, ${failed} échec(s).`)
  if (failures.length > 0) {
    console.log('Échecs :', failures.join(' | '))
  }

  console.log('\nNettoyage…')
  await admin.storage.from('project-references').remove([`${studioA.id}/${projectA.id}/references/test.txt`])
  await admin.auth.admin.deleteUser(alice.id)
  await admin.auth.admin.deleteUser(bob.id)
  await admin.auth.admin.deleteUser(carol.id)
  await admin.from('studios').delete().in('id', [studioA.id, studioB.id])

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Erreur inattendue pendant les tests RLS :', err)
  process.exit(1)
})
