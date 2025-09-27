import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Simulación de registro de usuario
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

      logger.info(`Usuario registrado: ${email}`);
    } catch (error: any) {
      logger.error('Error en registro:', error);
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
        return;
      }

      // Simulación de login
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

      logger.info(`Usuario logueado: ${email}`);
    } catch (error: any) {
      logger.error('Error en login:', error);
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newToken = 'new_jwt_token_' + Date.now();

      res.json({
        success: true,
        data: {
          accessToken: newToken
        }
      });
    } catch (error: any) {
      logger.error('Error en refresh token:', error);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error: any) {
      logger.error('Error en logout:', error);
      next(error);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error: any) {
      logger.error('Error obteniendo perfil:', error);
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error: any) {
      logger.error('Error actualizando perfil:', error);
      next(error);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
    } catch (error: any) {
      logger.error('Error cambiando contraseña:', error);
      next(error);
    }
  }
}

export default new AuthController();