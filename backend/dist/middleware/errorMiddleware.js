"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    error.statusCode = 404;
    logger_1.default.warn(`404 - Not Found: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next(error);
};
exports.notFound = notFound;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    logger_1.default.error(`Error ${err.statusCode || 500}: ${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: err.stack
    });
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new Error(message);
        error.statusCode = 404;
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new Error(message);
        error.statusCode = 400;
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = new Error(message);
        error.statusCode = 400;
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new Error(message);
        error.statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new Error(message);
        error.statusCode = 401;
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorMiddleware.js.map