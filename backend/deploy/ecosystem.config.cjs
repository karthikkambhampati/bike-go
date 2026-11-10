module.exports = {
  apps: [
    {
      name: 'bikego-backend',
      script: 'src/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '0.0.0.0'
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      max_memory_restart: '500M',
      restart_delay: 3000,
      autorestart: true
    }
  ]
};
