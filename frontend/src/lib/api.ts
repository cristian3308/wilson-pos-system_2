import { ApiResponse } from '@/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1', timeout = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      
      // Ensure consistent response format
      return {
        success: true,
        data: data.data || data,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }
      
      throw new ApiError('Unknown error occurred', 0);
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check
  async checkHealth() {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// API Services
export const dashboardApi = {
  getMetrics: () => apiClient.get('/dashboard'),
  getDailyReport: (date?: string) => 
    apiClient.get(`/dashboard/daily${date ? `?date=${date}` : ''}`),
  getHistoricalData: (days = 7) => 
    apiClient.get(`/dashboard/historical?days=${days}`),
};

export const parkingApi = {
  getVehicles: () => apiClient.get('/parqueadero/vehiculos'),
  registerEntry: (data: any) => apiClient.post('/parqueadero/entrada', data),
  processExit: (data: any) => apiClient.post('/parqueadero/salida', data),
  getOccupancy: () => apiClient.get('/parqueadero/ocupacion'),
  getRates: () => apiClient.get('/parqueadero/tarifas'),
  updateRates: (data: any) => apiClient.put('/parqueadero/tarifas', data),
};

export const carwashApi = {
  getServices: () => apiClient.get('/lavadero/servicios'),
  getOrders: () => apiClient.get('/lavadero/ordenes'),
  createOrder: (data: any) => apiClient.post('/lavadero/ordenes', data),
  updateOrder: (id: string, data: any) => 
    apiClient.put(`/lavadero/ordenes/${id}`, data),
  deleteOrder: (id: string) => apiClient.delete(`/lavadero/ordenes/${id}`),
  getOrderHistory: (days = 30) => 
    apiClient.get(`/lavadero/historial?days=${days}`),
};

export { ApiError };