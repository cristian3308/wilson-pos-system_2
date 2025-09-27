'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { DashboardMetrics, Vehicle, CarwashOrder, SystemNotification, LoadingState } from '@/types';
import { dashboardApi, parkingApi, carwashApi, ApiError } from '@/lib/api';

interface SystemState {
  // Data
  metrics: DashboardMetrics | null;
  vehicles: Vehicle[];
  carwashOrders: CarwashOrder[];
  notifications: SystemNotification[];
  
  // UI State
  loadingStates: {
    dashboard: LoadingState;
    parking: LoadingState;
    carwash: LoadingState;
    global: LoadingState;
  };
  
  // Connection
  isOnline: boolean;
  lastUpdate: string | null;
  
  // Error handling
  errors: Record<string, string>;
  retryCount: number;
}

type SystemAction =
  | { type: 'SET_LOADING'; payload: { key: keyof SystemState['loadingStates']; state: LoadingState } }
  | { type: 'SET_METRICS'; payload: DashboardMetrics }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] }
  | { type: 'SET_CARWASH_ORDERS'; payload: CarwashOrder[] }
  | { type: 'ADD_NOTIFICATION'; payload: SystemNotification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { key: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' }
  | { type: 'UPDATE_TIMESTAMP' };

const initialState: SystemState = {
  metrics: null,
  vehicles: [],
  carwashOrders: [],
  notifications: [],
  loadingStates: {
    dashboard: 'idle',
    parking: 'idle',
    carwash: 'idle',
    global: 'idle',
  },
  isOnline: true,
  lastUpdate: null,
  errors: {},
  retryCount: 0,
};

function systemReducer(state: SystemState, action: SystemAction): SystemState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key]: action.payload.state,
        },
      };
    
    case 'SET_METRICS':
      return {
        ...state,
        metrics: action.payload,
        lastUpdate: new Date().toISOString(),
        loadingStates: { ...state.loadingStates, dashboard: 'success' },
      };
    
    case 'SET_VEHICLES':
      return {
        ...state,
        vehicles: action.payload,
        loadingStates: { ...state.loadingStates, parking: 'success' },
      };
    
    case 'SET_CARWASH_ORDERS':
      return {
        ...state,
        carwashOrders: action.payload,
        loadingStates: { ...state.loadingStates, carwash: 'success' },
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 9)],
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'SET_ONLINE':
      return {
        ...state,
        isOnline: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
        loadingStates: {
          ...state.loadingStates,
          [action.payload.key as keyof SystemState['loadingStates']]: 'error',
        },
      };
    
    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors,
      };
    
    case 'INCREMENT_RETRY':
      return {
        ...state,
        retryCount: state.retryCount + 1,
      };
    
    case 'RESET_RETRY':
      return {
        ...state,
        retryCount: 0,
      };
    
    case 'UPDATE_TIMESTAMP':
      return {
        ...state,
        lastUpdate: new Date().toISOString(),
      };
    
    default:
      return state;
  }
}

interface SystemContextType {
  state: SystemState;
  actions: {
    loadDashboardMetrics: () => Promise<void>;
    loadVehicles: () => Promise<void>;
    loadCarwashOrders: () => Promise<void>;
    refreshAll: () => Promise<void>;
    addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
    removeNotification: (id: string) => void;
    clearError: (key: string) => void;
    retryOperation: (operation: () => Promise<void>) => Promise<void>;
  };
}

const SystemContext = createContext<SystemContextType | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(systemReducer, initialState);

  // Health check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isHealthy = await dashboardApi.getMetrics();
        dispatch({ type: 'SET_ONLINE', payload: true });
        if (state.retryCount > 0) {
          dispatch({ type: 'RESET_RETRY' });
        }
      } catch {
        dispatch({ type: 'SET_ONLINE', payload: false });
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30s
    checkConnection();

    return () => clearInterval(interval);
  }, [state.retryCount]);

  // Auto-refresh data
  useEffect(() => {
    if (state.isOnline) {
      const interval = setInterval(() => {
        if (state.loadingStates.global === 'idle') {
          loadDashboardMetrics();
        }
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [state.isOnline, state.loadingStates.global]);

  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    loadingKey: keyof SystemState['loadingStates'],
    errorKey: string,
    onSuccess?: (data: T) => void
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, state: 'loading' } });
      dispatch({ type: 'CLEAR_ERROR', payload: errorKey });
      
      const response = await apiCall();
      
      if (onSuccess) {
        onSuccess(response);
      }
      
      dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, state: 'success' } });
      dispatch({ type: 'UPDATE_TIMESTAMP' });
      
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Error de conexión';
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { key: errorKey, error: errorMessage } 
      });
      
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Error de Sistema',
        message: errorMessage,
      });
    }
  };

  const loadDashboardMetrics = async () => {
    await handleApiCall(
      () => dashboardApi.getMetrics(),
      'dashboard',
      'dashboard',
      (response: any) => {
        if (response.success && response.data) {
          dispatch({ type: 'SET_METRICS', payload: response.data });
        }
      }
    );
  };

  const loadVehicles = async () => {
    await handleApiCall(
      () => parkingApi.getVehicles(),
      'parking',
      'parking',
      (response: any) => {
        if (response.success && response.data) {
          dispatch({ type: 'SET_VEHICLES', payload: response.data });
        }
      }
    );
  };

  const loadCarwashOrders = async () => {
    await handleApiCall(
      () => carwashApi.getOrders(),
      'carwash',
      'carwash',
      (response: any) => {
        if (response.success && response.data) {
          dispatch({ type: 'SET_CARWASH_ORDERS', payload: response.data });
        }
      }
    );
  };

  const refreshAll = async () => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'global', state: 'loading' } });
    
    try {
      await Promise.allSettled([
        loadDashboardMetrics(),
        loadVehicles(),
        loadCarwashOrders(),
      ]);
      
      dispatch({ type: 'SET_LOADING', payload: { key: 'global', state: 'success' } });
      
      addNotification({
        type: 'success',
        title: 'Actualización Completa',
        message: 'Todos los datos han sido actualizados correctamente',
      });
      
    } catch {
      dispatch({ type: 'SET_LOADING', payload: { key: 'global', state: 'error' } });
    }
  };

  const addNotification = (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    
    // Auto-remove non-error notifications after 5 seconds
    if (notification.type !== 'error') {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: newNotification.id });
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearError = (key: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: key });
  };

  const retryOperation = async (operation: () => Promise<void>) => {
    if (state.retryCount >= 3) {
      addNotification({
        type: 'error',
        title: 'Límite de Reintentos',
        message: 'Se ha alcanzado el límite máximo de reintentos. Verifique la conexión.',
      });
      return;
    }
    
    dispatch({ type: 'INCREMENT_RETRY' });
    await operation();
  };

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, []);

  const contextValue: SystemContextType = {
    state,
    actions: {
      loadDashboardMetrics,
      loadVehicles,
      loadCarwashOrders,
      refreshAll,
      addNotification,
      removeNotification,
      clearError,
      retryOperation,
    },
  };

  return (
    <SystemContext.Provider value={contextValue}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}