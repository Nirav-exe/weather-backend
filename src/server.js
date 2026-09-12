const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`Weather backend listening on port ${env.port} [${env.nodeEnv}]`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
