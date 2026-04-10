require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket/socket');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize WebSocket
initSocket(server);

// Connect to MongoDB then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
}).catch((err) => {
  logger.error('Failed to connect to database', { error: err.message });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', { error: err.message });
  server.close(() => process.exit(1));
});
