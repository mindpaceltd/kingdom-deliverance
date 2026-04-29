const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3005'

const checks = [
  { path: '/', expected: 200 },
  { path: '/sermons', expected: 200 },
  { path: '/events', expected: 200 },
  { path: '/blog', expected: 200 },
  { path: '/search?q=faith', expected: 200 },
  { path: '/admin', expected: 200, redirectTo: '/admin/login' },
]

async function run() {
  let failed = 0
  for (const check of checks) {
    const url = `${baseUrl}${check.path}`
    const res = await fetch(url, { redirect: 'manual' })
    const isRedirect = res.status >= 300 && res.status < 400
    const location = res.headers.get('location') || ''

    if (check.redirectTo) {
      if (!isRedirect || !location.includes(check.redirectTo)) {
        console.error(`FAIL ${check.path}: expected redirect to ${check.redirectTo}, got ${res.status} ${location}`)
        failed++
      } else {
        console.log(`PASS ${check.path}: redirect ${res.status} -> ${location}`)
      }
      continue
    }

    if (res.status !== check.expected) {
      console.error(`FAIL ${check.path}: expected ${check.expected}, got ${res.status}`)
      failed++
    } else {
      console.log(`PASS ${check.path}: ${res.status}`)
    }
  }

  if (failed > 0) {
    process.exitCode = 1
  } else {
    console.log('Smoke checks passed.')
  }
}

run().catch((error) => {
  console.error('Smoke runner failed:', error)
  process.exit(1)
})
