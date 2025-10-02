"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
    try {
        logger_1.default.info('🍃 Running in demo mode - MongoDB connection skipped');
        logger_1.default.info('📁 Demo database mode active');
        return;
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_professional';
        const conn = await mongoose_1.default.connect(mongoURI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        });
        logger_1.default.info(`🍃 MongoDB Connected: ${conn.connection.host}`);
        logger_1.default.info(`📁 Database: ${conn.connection.name}`);
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('MongoDB reconnected');
        });
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            logger_1.default.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.default.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map