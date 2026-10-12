#!/usr/bin/env node
/**
 * apply-migrations.js
 *
 * Applies all pending Supabase migrations to the remote project
 * using the Supabase Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=your_pat node supabase/apply-migrations.js
 *
 * Or:
 *   npx -y supabase@latest login
 *   npx -y supabase@latest db push --project-ref lpfkfzlwkpyaklslynol
 *
 * The access token can be found at: https://supabase.com/dashboard/account/tokens
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

const PROJECT_REF = 'lpfkfzlwkpyaklslynol'
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!ACCESS_TOKEN) {
  console.error('❌  SUPABASE_ACCESS_TOKEN is required.')
  console.error('    Get one at: https://supabase.com/dashboard/account/tokens')
  console.error('    Run: SUPABASE_ACCESS_TOKEN=your_pat node supabase/apply-migrations.js')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(__dirname, 'migrations')
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort()

async function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        } else {
          resolve(JSON.parse(data))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  console.log(`🚀  Applying ${files.length} migration(s) to project ${PROJECT_REF}...\n`)

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file)
    const sql = fs.readFileSync(filePath, 'utf8')
    process.stdout.write(`  ▶  ${file} ... `)
    try {
      await runQuery(sql)
      console.log('✅  done')
    } catch (err) {
      console.log('❌  failed')
      console.error(`\n     Error: ${err.message}\n`)
      process.exit(1)
    }
  }

  console.log('\n✅  All migrations applied successfully.')
}

main()
