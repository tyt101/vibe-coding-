module.exports = {
  apps: [
    {
      name: 'langgraphjs-chat-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      kill_timeout: 30000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};