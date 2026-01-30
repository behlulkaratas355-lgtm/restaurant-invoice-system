module.exports = {
  apps: [
    {
      name: 'restaurant-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/root/restaurant-invoice-system/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        VITE_API_URL: 'http://45.144.176.150:5000/api'
      },
      error_file: '/tmp/frontend-error.log',
      out_file: '/tmp/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
