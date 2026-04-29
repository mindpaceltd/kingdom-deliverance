module.exports = {
  apps: [
    {
      name: 'kingdom-deliverance',
      script: './node_modules/.bin/next',
      args: 'start',
      cwd: '/home/n767765/kdcuganda.org',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};