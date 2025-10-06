import { useState, useEffect } from 'react';
import { dualDatabase } from '@/lib/dualDatabase';
import { parkingSystem } from '@/lib/parkingSystem';

interface DashboardData {
  metrics: {
    totalRevenue: number;
    parkingRevenue: number;
    carwashRevenue: number;
    subscriptionRevenue: number;
    activeSpots: number;
    completedServices: number;
    activeEmployees: number;
    activeWashes: number;
    totalVehicles: number;
    activeSubscriptions: number;
    expiringSubscriptions: number;
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

export const useDashboardDataReal = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTimeAgo = (dateString: string | Date) => {
    if (!dateString || dateString === '-' || dateString === '') return 'Hace un momento';
    
    let date: Date;
    try {
      date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'Hace un momento';
    } catch {
      return 'Hace un momento';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  const calculateTodayRevenue = async () => {
    try {
      // Usar el nuevo sistema de ingresos diarios
      const todayRevenue = await parkingSystem.getDailyParkingRevenue();
      return todayRevenue.totalRevenue;
    } catch (error) {
      console.error('Error calculando ingresos:', error);
      
      // Fallback al método anterior
      const vehicles = await dualDatabase.getParkingHistory();
      const today = new Date().toISOString().split('T')[0];
      return vehicles
        .filter(v => {
          const recordDate = v.fechaEntrada?.startsWith(today) || v.entrada?.startsWith(today);
          const isCompleted = v.estado === 'Completado' || v.estado === 'Salió' || v.estado === 'salio';
          return recordDate && isCompleted;
        })
        .reduce((total, v) => total + (v.cobro || 0), 0);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar datos del parqueadero, lavadero y suscripciones
      const [parkingTickets, parkingHistory, carwashTransactions, monthlySubscriptions] = await Promise.all([
        dualDatabase.getParkingTickets(),
        dualDatabase.getParkingHistory(),
        dualDatabase.getAllCarwashTransactions(),
        dualDatabase.getAllMonthlySubscriptions()
      ]);

      // console.log('📊 Datos cargados:', { 
      //   tickets: parkingTickets?.length || 0, 
      //   history: parkingHistory?.length || 0,
      //   carwash: carwashTransactions?.length || 0 
      // });

      // Calcular métricas del parqueadero - SOLO tickets realmente activos
      const activeSpots = parkingTickets?.filter((t: any) => 
        t.status === 'active' && !t.isPaid && !t.exitTime
      )?.length || 0;
      const totalVehicles = parkingHistory?.length || 0;
      const parkingRevenue = await calculateTodayRevenue();

      // Calcular métricas del lavadero
      const today = new Date().toISOString().split('T')[0];
      // ✅ ACTUALIZADO: Filtrar SOLO órdenes ACTIVAS (pendiente + en_proceso)
      // EXCLUIR: completed y cancelled (facturado)
      const activeWashes = carwashTransactions?.filter((o: any) => {
        const status = o.status || o.estado;
        return status === 'pending' || status === 'in_progress' || 
               status === 'pendiente' || status === 'en_proceso';
      })?.length || 0;
      
      console.log('📊 DASHBOARD - Total transacciones lavadero:', carwashTransactions?.length);
      console.log('📊 DASHBOARD - Órdenes activas:', activeWashes);
      carwashTransactions?.forEach((o: any) => {
        console.log(`   - ${o.ticketId}: ${o.status || o.estado} (placa: ${o.placa})`);
      });
      const completedServices = carwashTransactions?.filter((o: any) => 
        (o.status === 'completed' || o.estado === 'completado')
      )?.length || 0;
      
      // Calcular ingresos del lavadero SOLO DEL DÍA DE HOY
      const carwashRevenue = carwashTransactions
        ?.filter((o: any) => {
          const isCompleted = (o.status === 'completed' || o.estado === 'completado');
          const transactionDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : 
                                 o.horaCreacion ? new Date(o.horaCreacion).toISOString().split('T')[0] : null;
          const isToday = transactionDate === today;
          return isCompleted && isToday;
        })
        ?.reduce((total: number, o: any) => total + (o.basePrice || o.total || 0), 0) || 0;
      
      // console.log('💰 Ingresos de lavadero HOY:', carwashRevenue);

      // Calcular métricas de suscripciones mensuales
      const activeSubscriptions = monthlySubscriptions?.filter((sub: any) => sub.isActive)?.length || 0;
      
      // Suscripciones que vencen en los próximos 3 días
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const expiringSubscriptions = monthlySubscriptions?.filter((sub: any) => {
        if (!sub.isActive) return false;
        const endDate = new Date(sub.endDate);
        const now = new Date();
        return endDate > now && endDate <= threeDaysFromNow;
      })?.length || 0;

      // Calcular ingresos de suscripciones SOLO DEL DÍA DE HOY
      const subscriptionRevenue = monthlySubscriptions
        ?.filter((sub: any) => {
          const createdDate = sub.createdAt ? new Date(sub.createdAt).toISOString().split('T')[0] : null;
          return createdDate === today;
        })
        ?.reduce((total: number, sub: any) => total + (sub.amount || 0), 0) || 0;

      // Distribución de vehículos
      const vehicleTypes = parkingHistory?.reduce((acc: any, v: any) => {
        const type = v.tipo || 'Desconocido';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

      const vehicleDistribution = Object.entries(vehicleTypes).map(([name, count], index) => ({
        name,
        value: count as number,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]
      }));

      // Distribución de servicios de lavadero
      const serviceTypes = carwashTransactions?.reduce((acc: any, o: any) => {
        const service = o.serviceName || 'Básico';
        acc[service] = (acc[service] || 0) + 1;
        return acc;
      }, {}) || {};

      const carwashServices = Object.entries(serviceTypes).map(([name, count], index) => ({
        name,
        value: count as number,
        color: ['#8B5CF6', '#F59E0B', '#10B981'][index % 3]
      }));

      // ✅ Actividad reciente SEPARADA con información DETALLADA
      const parkingActivities = parkingHistory?.slice(-10).reverse().map((v: any) => {
        const isCompleted = v.estado === 'Completado' || v.estado === 'Salió' || v.estado === 'salio';
        const timeToUse = isCompleted && v.fechaSalida ? v.fechaSalida : v.fechaEntrada;
        const tipoVehiculo = v.tipo || 'Desconocido';
        const duracion = v.tiempo ? ` (${v.tiempo})` : '';
        
        let description = '';
        if (isCompleted) {
          description = `🚗 SALIDA - ${v.placa} (${tipoVehiculo})${duracion}`;
        } else {
          description = `🚗 INGRESO - ${v.placa} (${tipoVehiculo})`;
        }
        
        return {
          id: `parking-${v.id || v.barcode || Date.now()}`,
          type: 'parking' as const,
          description,
          time: formatTimeAgo(timeToUse),
          amount: isCompleted ? v.cobro : undefined,
          status: isCompleted ? 'completed' as const : 'pending' as const,
          user: v.placa,
          details: {
            placa: v.placa,
            tipo: tipoVehiculo,
            entrada: v.fechaEntrada,
            salida: v.fechaSalida,
            tiempo: v.tiempo,
            cobro: v.cobro
          }
        };
      }) || [];

      const carwashActivities = carwashTransactions?.slice(-10).reverse().map((o: any) => {
        const status = o.status || 'pending';
        const serviceName = o.serviceName || 'Lavado';
        const placa = o.vehiclePlate || o.placa || 'Sin placa';
        const numero = o.transactionNumber || o.numeroOrden || '';
        
        let statusEmoji = '';
        let statusText = '';
        if (status === 'completed' || status === 'completado') {
          statusEmoji = '✅';
          statusText = 'COMPLETADO';
        } else if (status === 'in_progress' || status === 'en_proceso') {
          statusEmoji = '🔄';
          statusText = 'EN PROCESO';
        } else if (status === 'cancelled' || status === 'cancelado') {
          statusEmoji = '💵';
          statusText = 'FACTURADO';
        } else {
          statusEmoji = '⏳';
          statusText = 'PENDIENTE';
        }
        
        const description = `${statusEmoji} ${statusText} - ${numero} - ${placa} (${serviceName})`;
        
        return {
          id: `carwash-${o.id}`,
          type: 'carwash' as const,
          description,
          time: formatTimeAgo(o.createdAt || o.horaCreacion),
          amount: (status === 'completed' || status === 'cancelled') ? (o.totalAmount || o.basePrice || o.total) : undefined,
          status: (status === 'completed' || status === 'completado') ? 'completed' as const : 
                  (status === 'in_progress' || status === 'en_proceso') ? 'pending' as const : 'cancelled' as const,
          user: placa,
          details: {
            numero: numero,
            placa: placa,
            servicio: serviceName,
            estado: statusText,
            monto: o.totalAmount || o.basePrice || o.total,
            fecha: o.createdAt || o.horaCreacion
          }
        };
      }) || [];

      const recentActivities = [
        ...parkingActivities,
        ...carwashActivities
      ].sort((a, b) => {
        // Ordenar por fecha más reciente primero
        try {
          const timeA = new Date(a.time.replace(/Hace\s+|min|h|días|\s+/g, '')).getTime();
          const timeB = new Date(b.time.replace(/Hace\s+|min|h|días|\s+/g, '')).getTime();
          return timeB - timeA;
        } catch {
          return 0;
        }
      }).slice(0, 8);

      // Datos de ingresos por semana (simulados basados en datos reales)
      const totalRevenue = parkingRevenue + carwashRevenue + subscriptionRevenue;
      const revenueData = [
        { date: 'Lun', revenue: Math.round(totalRevenue * 0.8), parking: Math.round(parkingRevenue * 0.8), carwash: Math.round(carwashRevenue * 0.8) },
        { date: 'Mar', revenue: Math.round(totalRevenue * 0.9), parking: Math.round(parkingRevenue * 0.9), carwash: Math.round(carwashRevenue * 0.9) },
        { date: 'Mié', revenue: Math.round(totalRevenue * 1.1), parking: Math.round(parkingRevenue * 1.1), carwash: Math.round(carwashRevenue * 1.1) },
        { date: 'Jue', revenue: Math.round(totalRevenue * 0.95), parking: Math.round(parkingRevenue * 0.95), carwash: Math.round(carwashRevenue * 0.95) },
        { date: 'Vie', revenue: Math.round(totalRevenue * 1.2), parking: Math.round(parkingRevenue * 1.2), carwash: Math.round(carwashRevenue * 1.2) },
        { date: 'Sáb', revenue: Math.round(totalRevenue * 1.3), parking: Math.round(parkingRevenue * 1.3), carwash: Math.round(carwashRevenue * 1.3) },
        { date: 'Dom', revenue: totalRevenue, parking: parkingRevenue, carwash: carwashRevenue }
      ];

      // Generar datos de ocupación del parqueadero
      const totalCapacity = 50;
      const occupiedSpots = activeSpots;
      const availableSpots = totalCapacity - occupiedSpots;
      const maintenanceSpots = Math.max(0, Math.min(5, availableSpots)); // Máximo 5 en mantenimiento
      const actualAvailable = availableSpots - maintenanceSpots;

      const occupancyData = [
        { name: 'Ocupados', value: occupiedSpots, color: '#EF4444' },
        { name: 'Disponibles', value: actualAvailable, color: '#10B981' },
        { name: 'Mantenimiento', value: maintenanceSpots, color: '#F59E0B' }
      ];

      // Obtener trabajadores activos
      const workers = await dualDatabase.getAllWorkers();
      const activeEmployees = workers.filter(w => w.isActive).length;

      setData({
        metrics: {
          totalRevenue,
          parkingRevenue,
          carwashRevenue,
          subscriptionRevenue,
          activeSpots,
          completedServices,
          activeEmployees,
          activeWashes,
          totalVehicles,
          activeSubscriptions,
          expiringSubscriptions
        },
        revenueData,
        occupancyData,
        vehicleDistribution,
        carwashServices,
        recentActivities
      });

    } catch (err) {
      console.error('❌ Error cargando datos del dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Actualizar datos cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshData: loadDashboardData
  };
};