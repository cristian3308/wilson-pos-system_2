import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './config/database';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import logger from './utils/logger';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import parkingRoutes from './routes/parkingRoutes';
import carwashRoutes from './routes/carwashRoutes';
import reportRoutes from './routes/reportRoutes';
import uploadRoutes from './routes/uploadRoutes';
import systemRoutes from './routes/system';
import demoRoutes from './routes/demo';
import parqueaderoRoutes from './routes/parqueadero';
import lavaderoRoutes from './routes/lavadero';
import configuracionRoutes from './routes/configuracion';
import dashboardRoutes from './routes/dashboard';

// Environment variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Database connection
connectDB();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// General middlewares
app.use(compression());
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Handle favicon.ico requests to avoid 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/parking', parkingRoutes);
app.use('/api/v1/carwash', carwashRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1', systemRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/v1', demoRoutes);
app.use('/api/v1', parqueaderoRoutes);
app.use('/api/v1', lavaderoRoutes);
app.use('/api/v1', configuracionRoutes);

// Socket.IO events
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Join room based on user role
  socket.on('join-room', (room: string) => {
    socket.join(room);
    logger.info(`User ${socket.id} joined room: ${room}`);
  });

  // Parking space updates
  socket.on('parking-update', (data) => {
    socket.broadcast.emit('parking-space-updated', data);
  });

  // Carwash service updates
  socket.on('carwash-update', (data) => {
    socket.broadcast.emit('carwash-service-updated', data);
  });

  // Real-time notifications
  socket.on('send-notification', (data) => {
    io.to(data.room).emit('notification', data);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔌 Socket.IO server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export { io };
export default app;