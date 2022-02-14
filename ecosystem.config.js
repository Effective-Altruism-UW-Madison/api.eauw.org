// pm2 config
module.exports = {
  apps: [
    {
      name: "api.eauw.org",
      script: "dist/index.js",
      env: {
        PORT: 3000,
        NODE_ENV: "PRODUCTION",
        REDIS_URL: "redis://127.0.0.1:6379"
      }
    }
  ]
};
