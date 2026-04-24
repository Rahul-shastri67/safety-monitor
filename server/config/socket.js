/**
 * Socket.io Configuration - Real-Time Alert Broadcasting
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Socket Authentication Middleware ─────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      // Allow unauthenticated for public alert feeds
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Authentication failed'));
    }
  });

  // ─── Connection Handler ───────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user?.id || 'anonymous';
    logger.info(`🔌 Socket connected: ${socket.id} | User: ${userId}`);

    // Join room based on role
    if (socket.user?.role === 'admin') {
      socket.join('admin-room');
      logger.info(`👑 Admin ${userId} joined admin-room`);
    }

    if (socket.user) {
      socket.join(`user-${socket.user.id}`);
      socket.join('authenticated');
    }

    // Always join general alert room
    socket.join('alerts');

    // ─── Client Events ────────────────────────────────────────────────────
    socket.on('join-camera', (cameraId) => {
      socket.join(`camera-${cameraId}`);
      logger.info(`📷 Socket ${socket.id} joined camera-${cameraId}`);
    });

    socket.on('leave-camera', (cameraId) => {
      socket.leave(`camera-${cameraId}`);
    });

    socket.on('subscribe-alerts', () => {
      socket.join('alerts');
    });

    // ─── Disconnect Handler ────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`❌ Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    // ─── Error Handler ─────────────────────────────────────────────────────
    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.id}: ${err.message}`);
    });
  });

  logger.info('📡 Socket.io initialized');
  return io;
};

// ─── Broadcast Alert to All Connected Clients ─────────────────────────────────
const broadcastAlert = (alertData) => {
  if (!io) {
    logger.warn('Socket.io not initialized');
    return;
  }

  io.to('alerts').emit('new-alert', {
    ...alertData,
    timestamp: new Date().toISOString(),
  });

  // Also emit to admin room with full data
  io.to('admin-room').emit('admin-alert', {
    ...alertData,
    timestamp: new Date().toISOString(),
  });

  logger.info(`📢 Alert broadcast: ${alertData.type} at ${alertData.camera}`);
};

// ─── Send Camera Update ───────────────────────────────────────────────────────
const sendCameraUpdate = (cameraId, data) => {
  if (!io) return;
  io.to(`camera-${cameraId}`).emit('camera-update', data);
};

// ─── Send System Stats ────────────────────────────────────────────────────────
const broadcastStats = (stats) => {
  if (!io) return;
  io.to('authenticated').emit('stats-update', stats);
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, broadcastAlert, sendCameraUpdate, broadcastStats, getIO };
