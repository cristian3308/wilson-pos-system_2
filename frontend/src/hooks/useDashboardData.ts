import { useState, useEffect } from 'react';
import { dualDatabase } from '@/lib/dualDatabase';

interface DashboardData {
  metrics: {
    totalRevenue: number;
    parkingRevenue: number;
    carwashRevenue: number;
    activeSpots: number;
    completedServices: number;
    activeEmployees: number;
    activeWashes: number;
    totalVehicles: number;
  };
  revenueData: Array<{
    date: string;
    revenue: number;
    parking: number;
    carwash: number;
  }>;
  occupancyData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  vehicleDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  carwashServices: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: 'parking' | 'carwash' | 'payment' | 'service';
    description: string;
    time: string;
    amount?: number;
    status: 'completed' | 'pending' | 'cancelled';
    user?: string;
  }>;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    metrics: {
      totalRevenue: 125840,
      parkingRevenue: 75840,
      carwashRevenue: 50000,
      activeSpots: 45,
      completedServices: 23,
      activeEmployees: 8,
      activeWashes: 3,
      totalVehicles: 156
    },
    revenueData: [
      { date: 'Lun', revenue: 15000, parking: 8000, carwash: 7000 },
      { date: 'Mar', revenue: 18000, parking: 10000, carwash: 8000 },
      { date: 'Mié', revenue: 22000, parking: 12000, carwash: 10000 },
      { date: 'Jue', revenue: 19000, parking: 11000, carwash: 8000 },
      { date: 'Vie', revenue: 25000, parking: 15000, carwash: 10000 },
      { date: 'Sáb', revenue: 28000, parking: 16000, carwash: 12000 },
      { date: 'Dom', revenue: 20000, parking: 12000, carwash: 8000 }
    ],
    occupancyData: [
      { name: 'Ocupados', value: 35, color: '#EF4444' },
      { name: 'Disponibles', value: 15, color: '#10B981' },
      { name: 'Mantenimiento', value: 5, color: '#F59E0B' }
    ],
    vehicleDistribution: [
      { name: 'Carros', value: 85, color: '#3B82F6' },
      { name: 'Motos', value: 56, color: '#10B981' },
      { name: 'Camiones', value: 15, color: '#F59E0B' }
    ],
    carwashServices: [
      { name: 'Básico', value: 45, color: '#8B5CF6' },
      { name: 'Completo', value: 32, color: '#F59E0B' },
      { name: 'Premium', value: 18, color: '#10B981' }
    ],
    recentActivities: [
      {
        id: '1',
        type: 'parking',
        description: 'Vehículo ingresó al espacio A-15',
        time: 'Hace 5 min',
        status: 'completed',
        user: 'Juan Pérez'
      },
      {
        id: '2',
        type: 'carwash',
        description: 'Lavado completo completado',
        time: 'Hace 10 min',
        amount: 25000,
        status: 'completed',
        user: 'María García'
      },
      {
        id: '3',
        type: 'payment',
        description: 'Pago procesado - Ticket #P-1245',
        time: 'Hace 15 min',
        amount: 15000,
        status: 'completed'
      },
      {
        id: '4',
        type: 'service',
        description: 'Encerado de vehículo iniciado',
        time: 'Hace 20 min',
        status: 'pending',
        user: 'Carlos López'
      }
    ]
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Aquí iría la llamada real a la API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (err) {
        setError('Error al cargar los datos del dashboard');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    // Simular actualización de datos
    await new Promise(resolve => setTimeout(resolve, 500));
    setData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        totalRevenue: prev.metrics.totalRevenue + Math.floor(Math.random() * 10000),
        activeSpots: Math.floor(Math.random() * 50) + 10
      }
    }));
    setIsLoading(false);
  };

  return { data, isLoading, error, refreshData };
};