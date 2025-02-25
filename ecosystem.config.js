module.exports = {
  apps: [{
    name: 'server',
    script: '/home/bitnami/express-couriers-api/server.js',
    instances: 1,
    autorestart: false,
    watch: false,
    exec_mode: 'fork',
    pmx: false, // Disable PM2 metrics
    env: {
      NODE_ENV: 'production',
      GOOGLE_PLACES_API_KEY: GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || '', // Fallback to empty if unset
    }
  }]
};
