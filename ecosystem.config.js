module.exports = {
  apps : [{
    name: 'market-insight',
    script: 'index.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    // args: 'start',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '100M',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      DEBUG: 'http,wss,stock,watch'
    },
    env_production: {
      NODE_ENV: 'production',
      API_TOKEN: process.env.API_TOKEN,
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      REDIS_USERNAME: process.env.REDIS_USERNAME,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD
    }
  }],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
