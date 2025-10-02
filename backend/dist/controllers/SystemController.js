"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class SystemController {
    async getSystemInfo(req, res) {
        try {
            const systemInfo = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                version: '1.0.0',
                features: {
                    authentication: 'Demo Mode',
                    database: 'Demo Mode (MongoDB bypassed)',
                    socketIO: 'Active',
                    cors: 'Enabled'
                },
                endpoints: {
                    health: '/health',
                    auth: '/api/v1/auth/*',
                    test: '/api/v1/test',
                    system: '/api/v1/system/*'
                }
            };
            logger_1.default.info('System info requested', { ip: req.ip });
            res.json(systemInfo);
        }
        catch (error) {
            logger_1.default.error('Error getting system info:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to get system information'
            });
        }
    }
    async testConnection(req, res) {
        try {
            const testResult = {
                status: 'SUCCESS',
                message: 'Frontend-Backend connection working correctly',
                timestamp: new Date().toISOString(),
                requestInfo: {
                    method: req.method,
                    userAgent: req.get('User-Agent'),
                    origin: req.get('Origin'),
                    ip: req.ip
                },
                backend: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    nodeVersion: process.version,
                    platform: process.platform
                }
            };
            logger_1.default.info('Connection test successful', { ip: req.ip });
            res.json(testResult);
        }
        catch (error) {
            logger_1.default.error('Connection test failed:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Connection test failed'
            });
        }
    }
}
exports.SystemController = SystemController;
//# sourceMappingURL=SystemController.js.map