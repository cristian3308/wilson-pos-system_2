import logger from '../utils/logger';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

class AuthService {
  async register(userData: any): Promise<{ user: UserData; tokens: any }> {
    try {
      // Simulación de registro
      const user: UserData = {
        id: 'user_' + Date.now(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'employee'
      };

      const tokens = this.generateTokens(user);

      return { user, tokens };
    } catch (error) {
      logger.error('Error en AuthService.register:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: UserData; tokens: any }> {
    try {
      // Simulación de login
      const user: UserData = {
        id: 'user_123',
        email,
        firstName: 'Usuario',
        lastName: 'Demo',
        role: 'admin'
      };

      const tokens = this.generateTokens(user);

      return { user, tokens };
    } catch (error) {
      logger.error('Error en AuthService.login:', error);
      throw error;
    }
  }

  private generateTokens(user: UserData) {
    // Simulación de tokens sin JWT por ahora
    const timestamp = Date.now();
    
    const accessToken = `mock_access_token_${user.id}_${timestamp}`;
    const refreshToken = `mock_refresh_token_${user.id}_${timestamp}`;

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Simulación de refresh token
      const newAccessToken = `new_mock_access_token_${Date.now()}`;

      return { accessToken: newAccessToken };
    } catch (error) {
      logger.error('Error en AuthService.refreshToken:', error);
      throw new Error('Invalid refresh token');
    }
  }
}

export default new AuthService();