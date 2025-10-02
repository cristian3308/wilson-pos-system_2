"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const database_1 = __importDefault(require("./config/database"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const logger_1 = __importDefault(require("./utils/logger"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const parkingRoutes_1 = __importDefault(require("./routes/parkingRoutes"));
const carwashRoutes_1 = __importDefault(require("./routes/carwashRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const system_1 = __importDefault(require("./routes/system"));
const demo_1 = __importDefault(require("./routes/demo"));
const parqueadero_1 = __importDefault(require("./routes/parqueadero"));
const lavadero_1 = __importDefault(require("./routes/lavadero"));
const configuracion_1 = __importDefault(require("./routes/configuracion"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});
exports.io = io;
(0, database_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.default.info(message.trim()) } }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/api/v1/parking', parkingRoutes_1.default);
app.use('/api/v1/carwash', carwashRoutes_1.default);
app.use('/api/v1/reports', reportRoutes_1.default);
app.use('/api/v1/upload', uploadRoutes_1.default);
app.use('/api/v1', system_1.default);
app.use('/api/v1', dashboard_1.default);
app.use('/api/v1', demo_1.default);
app.use('/api/v1', parqueadero_1.default);
app.use('/api/v1', lavadero_1.default);
app.use('/api/v1', configuracion_1.default);
io.on('connection', (socket) => {
    logger_1.default.info(`User connected: ${socket.id}`);
    socket.on('join-room', (room) => {
        socket.join(room);
        logger_1.default.info(`User ${socket.id} joined room: ${room}`);
    });
    socket.on('parking-update', (data) => {
        socket.broadcast.emit('parking-space-updated', data);
    });
    socket.on('carwash-update', (data) => {
        socket.broadcast.emit('carwash-service-updated', data);
    });
    socket.on('send-notification', (data) => {
        io.to(data.room).emit('notification', data);
    });
    socket.on('disconnect', () => {
        logger_1.default.info(`User disconnected: ${socket.id}`);
    });
});
app.use(errorMiddleware_1.notFound);
app.use(errorMiddleware_1.errorHandler);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger_1.default.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger_1.default.info(`📊 Health check available at http://localhost:${PORT}/health`);
    logger_1.default.info(`🔌 Socket.IO server running on port ${PORT}`);
});
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger_1.default.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        logger_1.default.info('Process terminated');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map