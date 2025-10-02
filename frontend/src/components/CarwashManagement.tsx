'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car,
  Truck,
  Bike,
  User,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  Timer,
  Droplets,
  Sparkles,
  Zap,
  Star,
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { getDualDB, Worker, CarwashService, CarwashTransaction } from '@/lib/dualDatabase';
import { getLocalDB, VehicleTypeConfig } from '@/lib/localDatabase';
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';
import { printThermalTicket, printCarwashTicket } from './PrintFallback';
import toast from 'react-hot-toast';

interface CarwashOrderData {
  ticketId: string;
  placa: string;
  vehicleType: 'car' | 'motorcycle' | 'truck';
  serviceId: string;
  serviceName: string;
  basePrice: number;
  workerId: string;
  estimatedTime: number;
}

const CarwashManagement: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<CarwashService[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeConfig[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<CarwashTransaction[]>([]);
  const [completedTransactions, setCompletedTransactions] = useState<CarwashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CarwashTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [filteredServices, setFilteredServices] = useState<CarwashService[]>([]);

  const [newOrderData, setNewOrderData] = useState<CarwashOrderData>({
    ticketId: '',
    placa: '',
    vehicleType: 'car',
    serviceId: '',
    serviceName: '',
    basePrice: 0,
    workerId: '',
    estimatedTime: 30
  });

  const [newServiceData, setNewServiceData] = useState({
    vehicleType: 'car',
    serviceName: '',
    basePrice: 0,
    estimatedTime: 30,
    isActive: true
  });

  // Estados de tiempo para transacciones activas
  const [timers, setTimers] = useState<{ [key: string]: number }>({});

  // Vehicle type icons
  const VehicleIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'motorcycle': return <Bike className="w-5 h-5" />;
      case 'truck': return <Truck className="w-5 h-5" />;
      default: return <Car className="w-5 h-5" />;
    }
  };

  // Service icons
  const ServiceIcon = ({ serviceName }: { serviceName: string }) => {
    if (serviceName.toLowerCase().includes('lavado básico')) return <Droplets className="w-5 h-5" />;
    if (serviceName.toLowerCase().includes('encerado')) return <Sparkles className="w-5 h-5" />;
    if (serviceName.toLowerCase().includes('detallado')) return <Star className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  // Cargar tipos de vehículos (predeterminados + personalizados)
  const loadVehicleTypes = async () => {
    try {
      const localDB = getLocalDB();
      const customTypes = await localDB.getVehicleTypes();
      
      // Tipos predeterminados
      const defaultTypes: VehicleTypeConfig[] = [
        { id: 'car', name: 'Automóvil', iconName: 'Car', tarifa: 0, isCustom: false, createdAt: new Date() },
        { id: 'motorcycle', name: 'Motocicleta', iconName: 'Bike', tarifa: 0, isCustom: false, createdAt: new Date() },
        { id: 'truck', name: 'Camión', iconName: 'Truck', tarifa: 0, isCustom: false, createdAt: new Date() },
      ];
      
      // Combinar tipos predeterminados con personalizados
      const allTypes = [...defaultTypes, ...customTypes];
      setVehicleTypes(allTypes);
      console.log('✅ Tipos de vehículos cargados en CarwashManagement:', allTypes.length);
      console.log('📋 Tipos personalizados:', customTypes.length);
    } catch (error) {
      console.error('❌ Error cargando tipos de vehículos:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadVehicleTypes();
    const interval = setInterval(() => {
      updateTimers();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);
  
  // Escuchar eventos de cambios en tipos de vehículos
  useEffect(() => {
    const handleVehicleTypeChange = () => {
      console.log('📢 Evento de cambio de tipo de vehículo recibido en CarwashManagement');
      loadVehicleTypes();
    };

    appEvents.on(APP_EVENTS.VEHICLE_TYPE_ADDED, handleVehicleTypeChange);
    appEvents.on(APP_EVENTS.VEHICLE_TYPE_UPDATED, handleVehicleTypeChange);
    appEvents.on(APP_EVENTS.VEHICLE_TYPE_DELETED, handleVehicleTypeChange);

    return () => {
      appEvents.off(APP_EVENTS.VEHICLE_TYPE_ADDED, handleVehicleTypeChange);
      appEvents.off(APP_EVENTS.VEHICLE_TYPE_UPDATED, handleVehicleTypeChange);
      appEvents.off(APP_EVENTS.VEHICLE_TYPE_DELETED, handleVehicleTypeChange);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actualizar servicios filtrados cuando cambian los servicios
  useEffect(() => {
    if (services.length > 0) {
      filterServicesByVehicleType(newOrderData.vehicleType);
    }
  }, [services]);

  const loadData = async () => {
    try {
      setLoading(true);
      const dualDB = getDualDB();
      const [workersData, servicesData, transactionsData] = await Promise.all([
        dualDB.getAllWorkers(),
        dualDB.getAllCarwashServices(),
        dualDB.getAllCarwashTransactions()
      ]);

      setWorkers(workersData.filter(w => w.isActive));
      const activeServices = servicesData.filter(s => s.isActive);
      setServices(activeServices);
      
      // Inicializar servicios filtrados
      filterServicesByVehicleType(newOrderData.vehicleType);
      
      const active = transactionsData.filter(t => t.status === 'pending' || t.status === 'in_progress');
      const completed = transactionsData.filter(t => t.status === 'completed' || t.status === 'cancelled');
      
      setActiveTransactions(active);
      setCompletedTransactions(completed.slice(0, 50)); // Mostrar solo los últimos 50

      // Initialize timers for active transactions
      const newTimers: { [key: string]: number } = {};
      active.forEach(transaction => {
        if (transaction.status === 'in_progress' && transaction.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(transaction.startTime).getTime()) / (1000 * 60));
          newTimers[transaction.id] = elapsed;
        }
      });
      setTimers(newTimers);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const updateTimers = () => {
    setTimers(prevTimers => {
      const newTimers = { ...prevTimers };
      activeTransactions.forEach(transaction => {
        if (transaction.status === 'in_progress' && transaction.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(transaction.startTime).getTime()) / (1000 * 60));
          newTimers[transaction.id] = elapsed;
        }
      });
      return newTimers;
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOrderData.placa.trim() || !newOrderData.serviceId || !newOrderData.workerId) {
      toast.error('Placa, servicio y trabajador son requeridos');
      return;
    }

    try {
      const selectedWorker = workers.find(w => w.id === newOrderData.workerId);
      const selectedService = services.find(s => s.id === newOrderData.serviceId);
      
      if (!selectedWorker || !selectedService) {
        toast.error('Trabajador o servicio no encontrado');
        return;
      }

      const workerCommission = (selectedService.basePrice * selectedWorker.percentage) / 100;
      const companyEarning = selectedService.basePrice - workerCommission;

      // Generar ID único para la transacción
      const transactionId = `carwash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Generar ticket ID automático
      const autoTicketId = `LAV${Date.now().toString().slice(-6)}`;

      const transactionData = {
        id: transactionId,
        ticketId: autoTicketId,
        placa: newOrderData.placa.toUpperCase(),
        vehicleType: newOrderData.vehicleType,
        serviceName: selectedService.serviceName,
        basePrice: selectedService.basePrice,
        workerId: selectedWorker.id,
        workerName: selectedWorker.name,
        workerPercentage: selectedWorker.percentage,
        workerCommission,
        companyEarning,
        status: 'pending' as const,
        startTime: new Date(),
        estimatedTime: selectedService.estimatedTime,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dualDB = getDualDB();
      await dualDB.saveCarwashTransaction(transactionData);
      
      toast.success(`Orden creada para ${selectedWorker.name} ${isOnline ? '' : '(sin conexión)'}`);

      // Imprimir ticket automáticamente usando los datos que acabamos de crear
      try {
        await printCarwashTicket(transactionData as any);
        toast.success('🖨️ Ticket generado');
      } catch (printError) {
        console.error('Error imprimiendo ticket:', printError);
        toast.error('Orden creada pero error al imprimir');
      }

      await loadData();
      setShowNewOrderModal(false);
      resetOrderForm();

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error al crear la orden');
    }
  };

  const handleStartWork = async (transaction: CarwashTransaction) => {
    try {
      const dualDB = getDualDB();
      await dualDB.updateCarwashTransaction({
        ...transaction,
        status: 'in_progress',
        startTime: new Date()
      });
      
      toast.success('Trabajo iniciado');
      await loadData();
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('Error al iniciar trabajo');
    }
  };

  const handleCompleteWork = async (transaction: CarwashTransaction) => {
    try {
      const dualDB = getDualDB();
      await dualDB.updateCarwashTransaction({
        ...transaction,
        status: 'completed',
        endTime: new Date()
      });

      // Generate receipt
      const receiptData = {
        type: 'exit' as const,
        ticket: {
          id: transaction.id,
          barcode: `CW${Date.now()}`,
          placa: transaction.placa,
          vehicleType: transaction.vehicleType,
          fechaEntrada: transaction.startTime,
          fechaSalida: new Date(),
          tiempoTotal: `${Math.floor((Date.now() - new Date(transaction.startTime).getTime()) / (1000 * 60))} min`,
          valorPagar: transaction.basePrice,
          estado: 'pagado' as const
        }
      };

      printThermalTicket(receiptData);
      
      toast.success('Trabajo completado e impreso');
      await loadData();
    } catch (error) {
      console.error('Error completing work:', error);
      toast.error('Error al completar trabajo');
    }
  };

  const handleCancelWork = async (transaction: CarwashTransaction) => {
    try {
      const dualDB = getDualDB();
      await dualDB.updateCarwashTransaction({
        ...transaction,
        status: 'cancelled',
        endTime: new Date()
      });
      
      toast.success('Trabajo cancelado');
      await loadData();
    } catch (error) {
      console.error('Error cancelling work:', error);
      toast.error('Error al cancelar trabajo');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newServiceData.serviceName.trim() || newServiceData.basePrice <= 0) {
      toast.error('Nombre del servicio y precio son requeridos');
      return;
    }

    try {
      const dualDB = getDualDB();
      
      // Crear el objeto de servicio completo con id y fechas
      const serviceToSave: CarwashService = {
        id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vehicleType: newServiceData.vehicleType,
        serviceName: newServiceData.serviceName,
        basePrice: newServiceData.basePrice,
        estimatedTime: newServiceData.estimatedTime,
        isActive: newServiceData.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await dualDB.saveCarwashService(serviceToSave);
      toast.success(`Servicio creado ${isOnline ? '' : '(sin conexión)'}`);
      
      await loadData();
      setShowServicesModal(false);
      resetServiceForm();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Error al crear servicio');
    }
  };

  const resetOrderForm = () => {
    setNewOrderData({
      ticketId: '',
      placa: '',
      vehicleType: 'car',
      serviceId: '',
      serviceName: '',
      basePrice: 0,
      workerId: '',
      estimatedTime: 30
    });
    // Resetear servicios filtrados al tipo por defecto
    filterServicesByVehicleType('car');
  };

  // Filtrar servicios por tipo de vehículo
  const filterServicesByVehicleType = (vehicleType: string) => {
    const filtered = services.filter(service => 
      service.vehicleType === vehicleType || 
      service.vehicleType === vehicleType.toLowerCase()
    );
    setFilteredServices(filtered);
    console.log(`🔍 Servicios filtrados para ${vehicleType}:`, filtered.length);
  };

  const resetServiceForm = () => {
    setNewServiceData({
      vehicleType: 'car',
      serviceName: '',
      basePrice: 0,
      estimatedTime: 30,
      isActive: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Lavadero</h1>
          <p className="text-gray-600">Administra servicios de lavado y trabajadores</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
            {isOnline ? 'En línea' : 'Sin conexión'}
          </div>
          
          <button
            onClick={() => setShowServicesModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Servicio
          </button>
          
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trabajos Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">
                {activeTransactions.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-3xl font-bold text-blue-600">
                {activeTransactions.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <Play className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados Hoy</p>
              <p className="text-3xl font-bold text-green-600">
                {completedTransactions.filter(t => 
                  new Date(t.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trabajadores</p>
              <p className="text-3xl font-bold text-purple-600">{workers.length}</p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Active Work Section */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Trabajos Activos</h2>
        </div>
        
        <div className="p-6">
          {activeTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay trabajos activos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <VehicleIcon type={transaction.vehicleType} />
                      <span className="font-medium">{transaction.placa}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(transaction.status)}`}>
                      {getStatusIcon(transaction.status)}
                      {transaction.status === 'pending' ? 'Pendiente' : 'En Progreso'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <ServiceIcon serviceName={transaction.serviceName} />
                      <span>{transaction.serviceName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <span>{transaction.workerName}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${transaction.basePrice.toLocaleString()}</span>
                      </div>
                      {transaction.status === 'in_progress' && timers[transaction.id] && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Timer className="w-4 h-4" />
                          <span>{formatTime(timers[transaction.id])}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {transaction.status === 'pending' ? (
                      <button
                        onClick={() => handleStartWork(transaction)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteWork(transaction)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completar
                      </button>
                    )}
                    
                    <button
                      onClick={async () => {
                        try {
                          await printCarwashTicket(transaction as any);
                          toast.success('🖨️ Ticket impreso');
                        } catch (error) {
                          console.error('Error imprimiendo:', error);
                          toast.error('Error al imprimir');
                        }
                      }}
                      className="px-3 py-2 border border-purple-300 text-purple-600 hover:bg-purple-50 rounded text-sm flex items-center gap-1"
                      title="Imprimir ticket"
                    >
                      🖨️
                    </button>
                    
                    <button
                      onClick={() => handleCancelWork(transaction)}
                      className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded text-sm flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Historial Reciente</h2>
        </div>
        
        <div className="p-6">
          {completedTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay transacciones completadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vehículo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Servicio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trabajador</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Precio</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTransactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <VehicleIcon type={transaction.vehicleType} />
                          <span className="font-medium">{transaction.placa}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <ServiceIcon serviceName={transaction.serviceName} />
                          <span>{transaction.serviceName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{transaction.workerName}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium">${transaction.basePrice.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status === 'completed' ? 'Completado' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={async () => {
                            try {
                              await printCarwashTicket(transaction as any);
                              toast.success('🖨️ Ticket impreso');
                            } catch (error) {
                              console.error('Error imprimiendo:', error);
                              toast.error('Error al imprimir');
                            }
                          }}
                          className="px-3 py-1 border border-purple-300 text-purple-600 hover:bg-purple-50 rounded text-sm inline-flex items-center gap-1"
                          title="Imprimir ticket"
                        >
                          🖨️ Imprimir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para nueva orden */}
      <AnimatePresence>
        {showNewOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Nueva Orden de Lavado</h2>
                <button
                  onClick={() => {
                    setShowNewOrderModal(false);
                    resetOrderForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    🎫 <strong>ID de Ticket:</strong> Se generará automáticamente al crear la orden
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa del Vehículo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderData.placa}
                    onChange={(e) => setNewOrderData({...newOrderData, placa: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: ABC123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Vehículo *
                  </label>
                  <select
                    value={newOrderData.vehicleType}
                    onChange={(e) => {
                      const vehicleType = e.target.value;
                      setNewOrderData({...newOrderData, vehicleType: vehicleType as any, serviceId: '', serviceName: '', basePrice: 0});
                      filterServicesByVehicleType(vehicleType);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {vehicleTypes.length > 0 ? (
                      vehicleTypes.map((vt) => {
                        const emojis: Record<string, string> = {
                          'car': '🚗',
                          'motorcycle': '🏍️',
                          'truck': '🚛',
                          'carro': '🚗',
                          'moto': '🏍️',
                          'camioneta': '🚙',
                          'buseta': '🚐'
                        };
                        const emoji = emojis[vt.id.toLowerCase()] || '🚙';
                        return (
                          <option key={vt.id} value={vt.id}>
                            {emoji} {vt.name}
                          </option>
                        );
                      })
                    ) : (
                      <>
                        <option value="car">🚗 Automóvil</option>
                        <option value="motorcycle">🏍️ Motocicleta</option>
                        <option value="truck">🚛 Camión</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio *
                  </label>
                  <select
                    value={newOrderData.serviceId}
                    onChange={(e) => {
                      const service = filteredServices.find(s => s.id === e.target.value);
                      setNewOrderData({
                        ...newOrderData, 
                        serviceId: e.target.value,
                        serviceName: service?.serviceName || '',
                        basePrice: service?.basePrice || 0,
                        estimatedTime: service?.estimatedTime || 30
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar servicio</option>
                    {filteredServices.length > 0 ? (
                      filteredServices.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.serviceName} - ${service.basePrice.toLocaleString()}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>🚫 No hay servicios para este tipo de vehículo</option>
                    )}
                  </select>
                  {filteredServices.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1 bg-green-50 p-2 rounded">
                      ✅ <strong>{filteredServices.length}</strong> servicio(s) disponible(s) para este tipo de vehículo
                    </p>
                  )}
                  {filteredServices.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1 bg-orange-50 p-2 rounded">
                      ⚠️ No hay servicios configurados para este tipo de vehículo. Crea uno primero.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trabajador *
                  </label>
                  <select
                    value={newOrderData.workerId}
                    onChange={(e) => setNewOrderData({...newOrderData, workerId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar trabajador</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} ({worker.percentage}%)
                      </option>
                    ))}
                  </select>
                </div>

                {newOrderData.serviceId && newOrderData.workerId && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Resumen de Comisión</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Precio del servicio:</span>
                        <span>${newOrderData.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comisión trabajador ({workers.find(w => w.id === newOrderData.workerId)?.percentage}%):</span>
                        <span className="text-green-600">
                          ${Math.floor((newOrderData.basePrice * (workers.find(w => w.id === newOrderData.workerId)?.percentage || 0)) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-medium">Para la empresa:</span>
                        <span className="font-medium">
                          ${(newOrderData.basePrice - Math.floor((newOrderData.basePrice * (workers.find(w => w.id === newOrderData.workerId)?.percentage || 0)) / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewOrderModal(false);
                      resetOrderForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Crear Orden
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal para nuevo servicio */}
      <AnimatePresence>
        {showServicesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Nuevo Servicio</h2>
                <button
                  onClick={() => {
                    setShowServicesModal(false);
                    resetServiceForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Vehículo *
                  </label>
                  <select
                    value={newServiceData.vehicleType}
                    onChange={(e) => setNewServiceData({...newServiceData, vehicleType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {vehicleTypes.length > 0 ? (
                      vehicleTypes.map((vt) => {
                        const emojis: Record<string, string> = {
                          'car': '🚗',
                          'motorcycle': '🏍️',
                          'truck': '🚛',
                          'carro': '🚗',
                          'moto': '🏍️',
                          'camioneta': '🚙',
                          'buseta': '🚐'
                        };
                        const emoji = emojis[vt.id.toLowerCase()] || '🚙';
                        return (
                          <option key={vt.id} value={vt.id}>
                            {emoji} {vt.name}
                          </option>
                        );
                      })
                    ) : (
                      <option value="">Cargando tipos de vehículos...</option>
                    )}
                  </select>
                  {vehicleTypes.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1 bg-blue-50 p-2 rounded">
                      💡 <strong>{vehicleTypes.length}</strong> tipo(s) disponible(s) - Los tipos personalizados de "Gestión de Parqueadero" aparecen aquí automáticamente
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    value={newServiceData.serviceName}
                    onChange={(e) => setNewServiceData({...newServiceData, serviceName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Lavado Completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Base *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={newServiceData.basePrice || ''}
                    onChange={(e) => setNewServiceData({...newServiceData, basePrice: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 15000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo Estimado (minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={newServiceData.estimatedTime || ''}
                    onChange={(e) => setNewServiceData({...newServiceData, estimatedTime: parseInt(e.target.value) || 30})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 30"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowServicesModal(false);
                      resetServiceForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Crear Servicio
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarwashManagement;