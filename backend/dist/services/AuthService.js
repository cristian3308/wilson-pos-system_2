"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    async register(userData) {
        try {
            const user = {
                id: 'user_' + Date.now(),
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: 'employee'
            };
            const tokens = this.generateTokens(user);
            return { user, tokens };
        }
        catch (error) {
            logger_1.default.error('Error en AuthService.register:', error);
            throw error;
        }
    }
    async login(email, password) {
        try {
            const user = {
                id: 'user_123',
                email,
                firstName: 'Usuario',
                lastName: 'Demo',
                role: 'admin'
            };
            const tokens = this.generateTokens(user);
            return { user, tokens };
        }
        catch (error) {
            logger_1.default.error('Error en AuthService.login:', error);
            throw error;
        }
    }
    generateTokens(user) {
        const timestamp = Date.now();
        const accessToken = `mock_access_token_${user.id}_${timestamp}`;
        const refreshToken = `mock_refresh_token_${user.id}_${timestamp}`;
        return { accessToken, refreshToken };
    }
    async refreshToken(refreshToken) {
        try {
            const newAccessToken = `new_mock_access_token_${Date.now()}`;
            return { accessToken: newAccessToken };
        }
        catch (error) {
            logger_1.default.error('Error en AuthService.refreshToken:', error);
            throw new Error('Invalid refresh token');
        }
    }
}
exports.default = new AuthService();
//# sourceMappingURL=AuthService.js.map