// migrate.js — Run via: node scripts/migrate.js
// Applies publishing schema migration to Supabase via Management REST API.

const https = require('https')

const PROJECT_REF = 'yofultqswneduesnvpzl'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZnVsdHFzd25lZHVlc252cHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3NzQsImV4cCI6MjA5Mjg5MTc3NH0.46B3sht8kkwRJX5voPYTmbMql-IG3nHTcYyYspq44tw'

// Try the Supabase SQL runner endpoint (requires service role or management token)
// Since we only have anon key, we use the rpc approach and fall back to reporting.

async function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql })
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', d => { data += d })
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function checkColumn(table, column) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      path: `/rest/v1/${table}?select=${column}&limit=1`,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', d => { data += d })
      res.on('end', () => {
        const exists = res.statusCode !== 400 || !data.includes('does not exist')
        resolve({ column, exists, status: res.statusCode })
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  console.log('=== Haze Publishing Schema Migration ===\n')

  // 1. Check what's missing
  console.log('Checking existing columns...')
  const projectChecks = ['cover_image', 'genre', 'visibility']
  const trackChecks = ['cover_image', 'genre', 'visibility', 'is_published', 'published_at', 'audio_url']

  const projectResults = await Promise.all(projectChecks.map(c => checkColumn('projects', c)))
  const trackResults = await Promise.all(trackChecks.map(c => checkColumn('audio_tracks', c)))

  const missingProject = projectResults.filter(r => !r.exists).map(r => r.column)
  const missingTrack = trackResults.filter(r => !r.exists).map(r => r.column)

  console.log('Missing from projects:', missingProject.length ? missingProject.join(', ') : 'none')
  console.log('Missing from audio_tracks:', missingTrack.length ? missingTrack.join(', ') : 'none')

  if (missingProject.length === 0 && missingTrack.length === 0) {
    console.log('\n✓ All columns already exist. No migration needed.')
    return
  }

  // 2. Try SQL runner endpoint
  console.log('\nAttempting migration via REST API...')
  const projectSQL = missingProject.length > 0
    ? missingProject.map(col => {
        const def = col === 'visibility' ? "ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'" : `ADD COLUMN IF NOT EXISTS ${col} TEXT`
        return `ALTER TABLE projects ${def};`
      }).join('\n')
    : ''

  const trackSQL = missingTrack.map(col => {
    if (col === 'is_published') return 'ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;'
    if (col === 'published_at') return 'ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;'
    if (col === 'visibility') return "ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';"
    return `ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS ${col} TEXT;`
  }).join('\n')

  const fullSQL = [projectSQL, trackSQL].filter(Boolean).join('\n')
  console.log('\nSQL to run:\n' + fullSQL)

  const result = await runQuery(fullSQL)
  console.log('\nAPI response:', result.status, result.body.substring(0, 300))

  if (result.status === 200 || result.status === 204) {
    console.log('\n✓ Migration successful!')
  } else {
    console.log('\n⚠ Could not apply via API (needs service role / SQL Editor access).')
    console.log('\n=== MANUAL STEPS REQUIRED ===')
    console.log('Go to: https://supabase.com/dashboard/project/yofultqswneduesnvpzl/database/query')
    console.log('Run this SQL:\n')
    console.log(fullSQL)
    console.log('\nAlso create storage buckets:')
    console.log('  - images (public)')
    console.log('  - audio (public)')
    console.log('\nOr run: node scripts/apply-migration.js (after adding service role key)')
  }
}

main().catch(console.error)
