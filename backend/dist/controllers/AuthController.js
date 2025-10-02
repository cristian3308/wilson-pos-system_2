"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, firstName, lastName } = req.body;
            if (!email || !password || !firstName || !lastName) {
                res.status(400).json({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
                return;
            }
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    id: 'user_' + Date.now(),
                    email,
                    firstName,
                    lastName,
                    role: 'employee'
                }
            });
            logger_1.default.info(`Usuario registrado: ${email}`);
        }
        catch (error) {
            logger_1.default.error('Error en registro:', error);
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
                return;
            }
            const mockToken = 'jwt_token_' + Date.now();
            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: {
                        id: 'user_123',
                        email,
                        firstName: 'Usuario',
                        lastName: 'Demo',
                        role: 'admin'
                    },
                    accessToken: mockToken,
                    refreshToken: mockToken + '_refresh'
                }
            });
            logger_1.default.info(`Usuario logueado: ${email}`);
        }
        catch (error) {
            logger_1.default.error('Error en login:', error);
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const newToken = 'new_jwt_token_' + Date.now();
            res.json({
                success: true,
                data: {
                    accessToken: newToken
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error en refresh token:', error);
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            res.json({
                success: true,
                message: 'Logout exitoso'
            });
        }
        catch (error) {
            logger_1.default.error('Error en logout:', error);
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            res.json({
                success: true,
                data: {
                    id: 'user_123',
                    email: 'admin@pos.com',
                    firstName: 'Administrador',
                    lastName: 'Sistema',
                    role: 'admin'
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error obteniendo perfil:', error);
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const { firstName, lastName } = req.body;
            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: {
                    firstName,
                    lastName
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error actualizando perfil:', error);
            next(error);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva son requeridas'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Contraseña cambiada exitosamente'
            });
        }
        catch (error) {
            logger_1.default.error('Error cambiando contraseña:', error);
            next(error);
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=AuthController.js.map