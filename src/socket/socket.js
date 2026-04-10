const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // JWT Authentication middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('WebSocket connection rejected: no token', { socketId: socket.id });
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn('WebSocket connection rejected: invalid token', { socketId: socket.id });
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId: socket.user?.id,
      role: socket.user?.role,
    });

    // Join role-based room
    if (socket.user?.role === 'admin') {
      socket.join('admins');
    }
    socket.join(`user:${socket.user?.id}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'WebSocket connected successfully',
      userId: socket.user?.id,
      timestamp: new Date().toISOString(),
    });

    socket.on('disconnect', (reason) => {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: socket.user?.id,
        reason,
      });
    });

    socket.on('error', (err) => {
      logger.error('WebSocket error', { socketId: socket.id, error: err.message });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
