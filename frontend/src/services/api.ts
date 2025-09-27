// Frontend API service
export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
  }

  async checkHealth() {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/test`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }

  async getSystemInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/system/info`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('System info failed:', error);
      throw error;
    }
  }
  async getDashboardStats() {
    try {
      const response = await fetch(`${this.baseUrl}/demo/dashboard-stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Dashboard stats failed:', error);
      throw error;
    }
  }

  async getProducts() {
    try {
      const response = await fetch(`${this.baseUrl}/demo/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get products failed:', error);
      throw error;
    }
  }

  async getSales() {
    try {
      const response = await fetch(`${this.baseUrl}/demo/sales`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get sales failed:', error);
      throw error;
    }
  }

  // Método genérico para hacer peticiones GET
  async get(endpoint: string) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `http://localhost:5000${endpoint}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`GET request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Métodos específicos del parqueadero y lavadero
  async getResumenDiario() {
    return this.get('/api/v1/sistema/resumen-diario');
  }

  async getVehiculosActivos() {
    return this.get('/api/v1/parqueadero/activos');
  }

  async getOrdenesLavadero() {
    return this.get('/api/v1/lavadero/ordenes-activas');
  }
}

export const apiService = new ApiService();