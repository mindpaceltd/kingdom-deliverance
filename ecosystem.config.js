/**
 * PM2 process file for Liquid Web (or any VPS) without Docker.
 *
 * Paths are overridable:
 *   APP_DIR=/var/www/kdcuganda.org pm2 start ecosystem.config.js
 *
 * Apps:
 *   - kingdom-deliverance  → Next.js (standalone or next start)
 *   - kdc-worker           → sermon queue worker (optional; ENABLE_QUEUE_PROCESSOR=true)
 */
const path = require('path')

const APP_DIR = process.env.APP_DIR || process.cwd()
const PORT = Number(process.env.PORT || 3005)

const standaloneServer = path.join(APP_DIR, '.next/standalone/server.js')
const useStandalone = require('fs').existsSync(standaloneServer)

module.exports = {
  apps: [
    {
      name: 'kingdom-deliverance',
      script: useStandalone ? standaloneServer : path.join(APP_DIR, 'node_modules/.bin/next'),
      args: useStandalone ? undefined : 'start',
      cwd: useStandalone ? path.join(APP_DIR, '.next/standalone') : APP_DIR,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 15,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        PORT,
        HOSTNAME: '0.0.0.0',
        NODE_OPTIONS: '--max-old-space-size=1024',
      },
      error_file: path.join(APP_DIR, 'logs/err.log'),
      out_file: path.join(APP_DIR, 'logs/out.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'kdc-worker',
      script: path.join(APP_DIR, 'node_modules/.bin/tsx'),
      args: 'src/workers/sermon-processor.ts',
      cwd: APP_DIR,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      // Start only when you need the queue: `pm2 start ecosystem.config.js --only kdc-worker`
      // Or set ENABLE_QUEUE_PROCESSOR and include in deploy script.
      error_file: path.join(APP_DIR, 'logs/worker-err.log'),
      out_file: path.join(APP_DIR, 'logs/worker-out.log'),
      time: true,
    },
  ],
}
