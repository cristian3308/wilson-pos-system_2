'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Building2, DollarSign, Edit, Trash2, Eye, Car, Truck, Bike, Plus, Clock, X } from 'lucide-react';
import { getDualDB, BusinessConfig } from '../lib/dualDatabase';
import { getLocalDB, VehicleTypeConfig } from '@/lib/localDatabase';
const dualDB = getDualDB();
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';
import DateRangePicker, { DateRange } from './DateRangePicker';
import DatabaseAdmin from './DatabaseAdmin';
import { useHistoryData } from '../hooks/useHistoryData';

const iconMap: Record<string, string> = {
  Car: '🚗',
  Truck: '🚛',
  Bike: '🛵',
};

const oldTypeNames: Record<string, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  truck: 'Camión',
};

interface BusinessConfigurationPanelProps {
  onConfigurationChange?: (config: any) => void;
}

const BusinessConfigurationPanel: React.FC<BusinessConfigurationPanelProps> = ({ 
  onConfigurationChange 
}) => {
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Estado para tipos de vehículos personalizados
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeConfig[]>([]);

  // 🧽 Estados para servicios de lavadero
  const [carwashServices, setCarwashServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({
    vehicleType: '',
    serviceName: '',
    basePrice: 0,
    estimatedTime: 30
  });
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  // Estado de conexión simplificado (siempre local)
  const [connectionStatus] = useState({
    isOnline: true,
    firebaseConnected: false, // Siempre false ahora
  });

  // Hook para datos del historial con filtros
  const {
    parkingRecords,
    carwashRecords,
    dailySummary,
    loading: historyLoading,
    loadData,
    deleteParkingRecord,
    deleteCarwashRecord,
    updateParkingRecord
  } = useHistoryData();

  // Estados para modales de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editType, setEditType] = useState<'parking' | 'carwash'>('parking');

  useEffect(() => {
    loadConfiguration();
    loadVehicleTypes();
    loadCarwashServices(); // 🧽 Cargar servicios del lavadero
  }, []);
  
  // Escuchar eventos de cambios en tipos de vehículos
  useEffect(() => {
    const handleVehicleTypeChange = () => {
      console.log('📢 Evento de cambio de tipo de vehículo recibido en configuraciones, recargando...');
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

  const loadVehicleTypes = async () => {
    try {
      const localDB = getLocalDB();
      const types = await localDB.getVehicleTypes();
      setVehicleTypes(types);
      console.log('✅ Tipos de vehículos personalizados cargados en configuraciones:', types.length);
    } catch (error) {
      console.error('Error cargando tipos de vehículos:', error);
    }
  };
  
  const updateVehicleTypeRate = async (vehicleTypeId: string, newRate: number) => {
    try {
      const localDB = getLocalDB();
      await localDB.updateVehicleType(vehicleTypeId, { tarifa: newRate });
      await loadVehicleTypes();
      appEvents.emit(APP_EVENTS.VEHICLE_TYPE_UPDATED, { id: vehicleTypeId, tarifa: newRate });
      setMessage('✅ Tarifa actualizada correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error actualizando tarifa:', error);
      setMessage('❌ Error al actualizar la tarifa');
    }
  };
  
  const deleteVehicleType = async (vehicleTypeId: string) => {
    if (!confirm('¿Está seguro de eliminar este tipo de vehículo personalizado?')) {
      return;
    }

    try {
      const localDB = getLocalDB();
      await localDB.deleteVehicleType(vehicleTypeId);
      await loadVehicleTypes();
      appEvents.emit(APP_EVENTS.VEHICLE_TYPE_DELETED, { id: vehicleTypeId });
      setMessage('✅ Tipo de vehículo eliminado');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error eliminando tipo de vehículo:', error);
      setMessage('❌ Error al eliminar: ' + (error as Error).message);
    }
  };

  // 🧽 FUNCIONES PARA GESTIONAR SERVICIOS DEL LAVADERO
  const loadCarwashServices = async () => {
    try {
      const dualDB = getDualDB();
      const services = await dualDB.getAllCarwashServices();
      setCarwashServices(services.filter(s => s.isActive));
      console.log('✅ Servicios de lavadero cargados:', services.length);
    } catch (error) {
      console.error('Error cargando servicios de lavadero:', error);
    }
  };

  const addCarwashService = async () => {
    if (!newService.serviceName || newService.basePrice <= 0) {
      setMessage('❌ Completa todos los campos del servicio');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const dualDB = getDualDB();
      const service = {
        id: `service_${Date.now()}`,
        vehicleType: newService.vehicleType,
        serviceName: newService.serviceName,
        basePrice: newService.basePrice,
        estimatedTime: newService.estimatedTime,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await dualDB.saveCarwashService(service);
      await loadCarwashServices();
      
      // Resetear formulario
      setNewService({
        vehicleType: '',
        serviceName: '',
        basePrice: 0,
        estimatedTime: 30
      });
      setShowAddServiceModal(false);
      
      setMessage('✅ Servicio agregado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error agregando servicio:', error);
      setMessage('❌ Error al agregar servicio');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateCarwashService = async (serviceId: string, field: string, value: any) => {
    try {
      const dualDB = getDualDB();
      const service = carwashServices.find(s => s.id === serviceId);
      if (!service) return;

      const updatedService = {
        ...service,
        [field]: value,
        updatedAt: new Date()
      };

      await dualDB.updateCarwashService(updatedService);
      await loadCarwashServices();
      
      setMessage('✅ Servicio actualizado');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      setMessage('❌ Error al actualizar servicio');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteCarwashService = async (serviceId: string) => {
    if (!confirm('¿Está seguro de eliminar este servicio?')) {
      return;
    }

    try {
      const dualDB = getDualDB();
      await dualDB.deleteCarwashService(serviceId);
      await loadCarwashServices();
      
      setMessage('✅ Servicio eliminado');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      setMessage('❌ Error al eliminar servicio');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const dualDB = getDualDB();
      const businessConfig = await dualDB.getBusinessConfig();
      
      if (businessConfig) {
        setConfig(businessConfig);
      } else {
        // Configuración por defecto
        const defaultConfig: BusinessConfig = {
          id: 'business_config_001',
          businessName: 'Mi Parqueadero Local',
          businessAddress: 'Dirección del negocio',
          businessPhone: '3001234567',
          carParkingRate: 3000,
          motorcycleParkingRate: 2000,
          truckParkingRate: 4000,
          carwashEnabled: true,
          parkingEnabled: true,
          vehicleTypes: [], // Inicializar con array vacío
          ticketData: {
            companyName: 'WILSON CARS & WASH',
            companySubtitle: 'PARKING PROFESSIONAL',
            nit: '19.475.534-7',
            address: 'Calle 123 #45-67, Bogotá D.C.',
            phone: '+57 (1) 234-5678',
            email: 'info@wilsoncarwash.com',
            website: 'www.wilsoncarwash.com',
            footerMessage: '¡Gracias por confiar en nosotros!',
            footerInfo: 'Horario: 24/7 | Servicio completo de parqueadero'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setConfig(defaultConfig);
        await dualDB.saveBusinessConfig(defaultConfig);
      }
      
      setMessage('Configuración cargada correctamente');
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setMessage('Error cargando configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setLoading(true);
    try {
      const dualDB = getDualDB();
      
      // 🔄 CRÍTICO: Recargar vehicleTypes FRESCOS desde IndexedDB antes de guardar
      console.log('🔄 Recargando vehicleTypes FRESCOS antes de guardar configuración...');
      const freshConfig = await dualDB.getBusinessConfig();
      const freshVehicleTypes = freshConfig?.vehicleTypes || [];
      console.log('✅ VehicleTypes FRESCOS obtenidos:', freshVehicleTypes);
      
      const updatedConfig = {
        ...config,
        vehicleTypes: freshVehicleTypes, // ✅ Usar vehicleTypes FRESCOS, no los de memoria
        updatedAt: new Date()
      };
      
      console.log('💾 Guardando configuración con vehicleTypes actualizados:', updatedConfig);
      await dualDB.saveBusinessConfig(updatedConfig);
      setConfig(updatedConfig);
      setMessage('✅ Configuración guardada correctamente');
      
      // ✅ EMITIR EVENTO PARA QUE OTROS COMPONENTES SE ACTUALICEN
      appEvents.emit(APP_EVENTS.CONFIG_UPDATED, updatedConfig);
      console.log('📡 Evento CONFIG_UPDATED emitido - Configuración actualizada');
      
      // Notificar cambio si hay callback
      if (onConfigurationChange) {
        onConfigurationChange(updatedConfig);
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setMessage('❌ Error guardando configuración');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (field: keyof BusinessConfig, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [field]: value
    });
  };

  const updateTicketData = (field: string, value: string) => {
    if (!config) return;
    
    const ticketData = config.ticketData || {
      companyName: '',
      companySubtitle: '',
      nit: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      footerMessage: '',
      footerInfo: ''
    };
    
    setConfig({
      ...config,
      ticketData: {
        ...ticketData,
        [field]: value
      }
    });
  };

  const updateMonthlyPlanPrice = (timeType: 'day' | 'night', value: number) => {
    if (!config) return;
    
    const monthlyPlanPrices = config.monthlyPlanPrices || {
      day: 50000,
      night: 40000
    };
    
    setConfig({
      ...config,
      monthlyPlanPrices: {
        ...monthlyPlanPrices,
        [timeType]: value
      }
    });
  };

  // ✅ NUEVO: Función para recalcular automáticamente el monto - Sistema de MEDIAS HORAS
  const recalculateParkingAmount = (entryTime: Date, exitTime: Date, vehicleType: string): number => {
    if (!entryTime || !exitTime) return 0;
    
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    
    if (totalMinutes <= 0) return 0;
    
    // Obtener tarifa por hora según el tipo de vehículo
    let hourlyRate = 3000; // Carro por defecto
    if (vehicleType === 'motorcycle') {
      hourlyRate = config?.motorcycleParkingRate || 2000;
    } else if (vehicleType === 'truck') {
      hourlyRate = config?.truckParkingRate || 4000;
    } else if (vehicleType === 'car') {
      hourlyRate = config?.carParkingRate || 3000;
    }
    
    // Calcular horas completas y minutos restantes
    const fullHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    // Calcular costo
    let totalAmount = 0;
    
    // Cobrar las horas completas
    totalAmount += fullHours * hourlyRate;
    
    // Cobrar la fracción restante
    if (remainingMinutes > 0) {
      if (remainingMinutes <= 29) {
        // 1-29 minutos = mitad del precio (media hora)
        totalAmount += hourlyRate / 2;
      } else {
        // 30-60 minutos = precio completo (hora completa)
        totalAmount += hourlyRate;
      }
    }
    
    console.log(`💰 Recálculo automático: ${totalMinutes} min (${fullHours}h ${remainingMinutes}min) = $${totalAmount}`);
    
    return totalAmount;
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Configuración del Sistema</h1>
                <p className="text-gray-600 mt-1">Administra la configuración de tu negocio</p>
              </div>
            </div>
            
            {/* Estado de conexión mejorado */}
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Sistema Local Activo</span>
              </div>
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-600">Firebase Deshabilitado</span>
              </div>
            </div>
          </div>

          {/* Mensaje de estado mejorado */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl flex items-center space-x-3 ${
              message.includes('✅') ? 'bg-green-50 border border-green-200' : 
              message.includes('❌') ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                message.includes('✅') ? 'bg-green-500' : 
                message.includes('❌') ? 'bg-red-500' : 'bg-blue-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                message.includes('✅') ? 'text-green-700' : 
                message.includes('❌') ? 'text-red-700' : 'text-blue-700'
              }`}>
                {message}
              </span>
            </div>
          )}
        </div>

        {/* Grid de configuraciones */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Información del negocio */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Información del Negocio</h2>
              </div>
              <p className="text-blue-100 mt-2">Configura los datos principales de tu empresa</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  value={config.businessName}
                  onChange={(e) => updateConfig('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ej: Wilson Cars & Wash"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={config.businessPhone}
                  onChange={(e) => updateConfig('businessPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ej: +57 300 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección del Negocio
                </label>
                <input
                  type="text"
                  value={config.businessAddress}
                  onChange={(e) => updateConfig('businessAddress', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ej: Calle 123 #45-67, Bogotá"
                />
              </div>
            </div>
          </div>

          {/* Configuración Detallada de Parqueadero */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">Configuración de Parqueadero</h2>
                    <p className="text-blue-100 mt-1 text-sm">Tarifas y configuración del sistema de parking</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.parkingEnabled}
                    onChange={(e) => updateConfig('parkingEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-blue-400/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/30"></div>
                </label>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Tarifas Predeterminadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Car className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-blue-900">Carro</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 font-bold">$</span>
                      <input
                        type="number"
                        value={config.carParkingRate}
                        onChange={(e) => updateConfig('carParkingRate', parseInt(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg font-semibold text-gray-800"
                        placeholder="3000"
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Por hora</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200 hover:border-orange-400 transition-all">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Bike className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-orange-900">Moto</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 font-bold">$</span>
                      <input
                        type="number"
                        value={config.motorcycleParkingRate}
                        onChange={(e) => updateConfig('motorcycleParkingRate', parseInt(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 border-2 border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-lg font-semibold text-gray-800"
                        placeholder="2000"
                      />
                    </div>
                    <p className="text-xs text-orange-600 mt-2">Por hora</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Truck className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-purple-900">Camión</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 font-bold">$</span>
                      <input
                        type="number"
                        value={config.truckParkingRate}
                        onChange={(e) => updateConfig('truckParkingRate', parseInt(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-lg font-semibold text-gray-800"
                        placeholder="4000"
                      />
                    </div>
                    <p className="text-xs text-purple-600 mt-2">Por hora</p>
                  </div>
                </div>
              </div>

              {/* Tipos de vehículos personalizados */}
              {vehicleTypes.length > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-teal-600" />
                    Tipos Personalizados
                    <span className="text-sm font-normal text-gray-500">({vehicleTypes.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {vehicleTypes.map((vehicleType, index) => {
                      const colors = [
                        { gradient: 'from-teal-50 to-teal-100', border: 'border-teal-200 hover:border-teal-400', iconBg: 'bg-teal-500', text: 'text-teal-900', inputBorder: 'border-teal-300', ring: 'focus:ring-teal-500', dollarSign: 'text-teal-600' },
                        { gradient: 'from-pink-50 to-pink-100', border: 'border-pink-200 hover:border-pink-400', iconBg: 'bg-pink-500', text: 'text-pink-900', inputBorder: 'border-pink-300', ring: 'focus:ring-pink-500', dollarSign: 'text-pink-600' },
                        { gradient: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200 hover:border-indigo-400', iconBg: 'bg-indigo-500', text: 'text-indigo-900', inputBorder: 'border-indigo-300', ring: 'focus:ring-indigo-500', dollarSign: 'text-indigo-600' },
                        { gradient: 'from-amber-50 to-amber-100', border: 'border-amber-200 hover:border-amber-400', iconBg: 'bg-amber-500', text: 'text-amber-900', inputBorder: 'border-amber-300', ring: 'focus:ring-amber-500', dollarSign: 'text-amber-600' },
                        { gradient: 'from-rose-50 to-rose-100', border: 'border-rose-200 hover:border-rose-400', iconBg: 'bg-rose-500', text: 'text-rose-900', inputBorder: 'border-rose-300', ring: 'focus:ring-rose-500', dollarSign: 'text-rose-600' },
                      ];
                      const colorScheme = colors[index % colors.length];

                      return (
                        <div key={vehicleType.id} className={`bg-gradient-to-br ${colorScheme.gradient} p-4 rounded-xl border-2 ${colorScheme.border} transition-all relative group`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 ${colorScheme.iconBg} rounded-lg text-white text-sm`}>
                                {iconMap[vehicleType.iconName] || '🚗'}
                              </div>
                              <span className={`text-sm font-bold ${colorScheme.text}`}>
                                {vehicleType.name}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteVehicleType(vehicleType.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all duration-200 shadow-sm"
                              title="Eliminar tipo personalizado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="relative">
                            <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colorScheme.dollarSign} font-bold`}>$</span>
                            <input
                              type="number"
                              value={vehicleType.tarifa}
                              onChange={(e) => {
                                const newRate = parseInt(e.target.value) || 0;
                                if (newRate !== vehicleType.tarifa) {
                                  updateVehicleTypeRate(vehicleType.id, newRate);
                                }
                              }}
                              className={`w-full pl-8 pr-4 py-3 border-2 ${colorScheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${colorScheme.ring} bg-white text-lg font-semibold text-gray-800`}
                              placeholder="2000"
                            />
                          </div>
                          <p className="text-xs mt-2 opacity-75">Por hora</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Tip:</strong> Los tipos personalizados se crean en la sección "Gestión de Parqueadero" y aparecen automáticamente aquí.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configuración Detallada de Lavadero */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🧽</span>
                <h2 className="text-xl font-bold text-white">Configuración de Lavadero</h2>
              </div>
              <p className="text-cyan-100 mt-2">Servicios y precios del carwash profesional</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 🧽 Servicios Disponibles - DINÁMICOS */}
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-cyan-800 flex items-center gap-2">
                    💧 Servicios Disponibles
                    <span className="text-sm font-normal text-cyan-600">({carwashServices.length})</span>
                  </h4>
                  <button
                    onClick={() => setShowAddServiceModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Servicio
                  </button>
                </div>
                
                {carwashServices.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg border-2 border-dashed border-cyan-300 text-center">
                    <span className="text-4xl mb-3 block">🧽</span>
                    <p className="text-gray-600 font-medium">No hay servicios configurados</p>
                    <p className="text-sm text-gray-500 mt-1">Haz clic en "Agregar Servicio" para crear uno</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      const grouped: Record<string, any[]> = {};
                      carwashServices.forEach(service => {
                        const vt = vehicleTypes.find(v => v.id === service.vehicleType || v.name === service.vehicleType);
                        const key = vt?.id || service.vehicleType;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(service);
                      });
                      return Object.entries(grouped).map(([typeKey, services]) => {
                        const vt = vehicleTypes.find(v => v.id === typeKey || v.name === typeKey);
                        const iconEmoji = iconMap[vt?.iconName || ''] || '🚗';
                        const vehicleName = vt?.name || oldTypeNames[typeKey] || typeKey;
                        return (
                          <div key={typeKey}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl">{iconEmoji}</span>
                              <h5 className="font-semibold text-cyan-800">{vehicleName}</h5>
                              <span className="text-xs text-gray-500">({services.length})</span>
                            </div>
                            <div className="space-y-2">
                              {services.map((service: any) => (
                                <div key={service.id} className="bg-white p-4 rounded-lg border-2 border-cyan-200 hover:border-cyan-400 transition-all group">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <input
                                          type="text"
                                          value={service.serviceName}
                                          onChange={(e) => updateCarwashService(service.id, 'serviceName', e.target.value)}
                                          className="font-semibold text-gray-800 border-b-2 border-transparent hover:border-cyan-300 focus:border-cyan-500 focus:outline-none px-1 py-0.5 transition-colors"
                                        />
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5" />
                                          <input
                                            type="number"
                                            value={service.estimatedTime}
                                            onChange={(e) => updateCarwashService(service.id, 'estimatedTime', parseInt(e.target.value))}
                                            className="w-12 border-b border-transparent hover:border-gray-300 focus:border-cyan-500 focus:outline-none text-center"
                                          /> min
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-500 text-sm">$</span>
                                          <input
                                            type="number"
                                            value={service.basePrice}
                                            onChange={(e) => updateCarwashService(service.id, 'basePrice', parseInt(e.target.value))}
                                            className="w-24 text-right font-bold text-green-600 text-lg border-b-2 border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none px-1"
                                          />
                                        </div>
                                        <p className="text-xs text-gray-500">Precio base</p>
                                      </div>
                                      
                                      <button
                                        onClick={() => deleteCarwashService(service.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Eliminar servicio"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
                
                {carwashServices.length > 0 && (
                  <div className="mt-4 p-3 bg-cyan-100 rounded-lg border border-cyan-300">
                    <p className="text-sm text-cyan-800">
                      💡 <strong>Tip:</strong> Haz clic en cualquier campo para editarlo en tiempo real
                    </p>
                  </div>
                )}
              </div>

              {/* ⚙️ Configuraciones del Lavadero */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">⚙️ Configuraciones del Lavadero</h4>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.carwashEnabled}
                      onChange={(e) => updateConfig('carwashEnabled', e.target.checked)}
                      className="w-4 h-4 text-cyan-600 border-2 border-gray-300 rounded focus:ring-cyan-500 mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">Sistema de Lavadero Activo</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-7">Habilita o deshabilita el módulo de carwash</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuración Empresarial y de Tickets */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">�</span>
                <div>
                  <h2 className="text-xl font-bold text-white">Configuración Empresarial</h2>
                  <p className="text-green-100 mt-1 text-sm">Información de la empresa y personalización de tickets</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Sección única simplificada: Solo dirección */}
              <div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Configuracion del Negocio</h3>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <label className="block text-sm font-bold text-blue-800 uppercase tracking-wide mb-3">
                    📍 Direccion Completa
                  </label>
                  <input
                    type="text"
                    value={config.ticketData?.address || ''}
                    onChange={(e) => updateTicketData('address', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-base"
                    placeholder="Calle 123 #45-67, Bogota D.C."
                  />
                  <p className="text-xs text-blue-700 mt-3">Esta direccion aparecera en todos los tickets impresos</p>
                </div>
              </div>

              {/* Sección de precios de planes mensuales */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-purple-200">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Precios Planes Mensuales</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Precio Diurno */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                    <label className="block text-sm font-bold text-yellow-800 uppercase tracking-wide mb-3">
                      ☀️ Precio Plan Diurno
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-yellow-600 font-bold text-lg">$</span>
                      <input
                        type="number"
                        value={config?.monthlyPlanPrices?.day || 0}
                        onChange={(e) => updateMonthlyPlanPrice('day', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-gray-800 text-lg font-semibold"
                        placeholder="50000"
                      />
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">Precio para planes mensuales de día</p>
                  </div>

                  {/* Precio Nocturno */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                    <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wide mb-3">
                      🌙 Precio Plan Nocturno
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-indigo-600 font-bold text-lg">$</span>
                      <input
                        type="number"
                        value={config?.monthlyPlanPrices?.night || 0}
                        onChange={(e) => updateMonthlyPlanPrice('night', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800 text-lg font-semibold"
                        placeholder="40000"
                      />
                    </div>
                    <p className="text-xs text-indigo-700 mt-2">Precio para planes mensuales de noche</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Servicios habilitados y acciones */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Servicios y Configuración Avanzada</span>
            </h2>
            <p className="text-indigo-100 mt-2">Habilita o deshabilita servicios del sistema</p>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Servicios */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Servicios Disponibles</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.parkingEnabled}
                        onChange={(e) => updateConfig('parkingEnabled', e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 mr-4"
                      />
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🚗</span>
                        <div>
                          <span className="text-sm font-semibold text-blue-800">Sistema de Parqueadero</span>
                          <p className="text-xs text-blue-600">Gestión completa de vehículos</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.carwashEnabled}
                        onChange={(e) => updateConfig('carwashEnabled', e.target.checked)}
                        className="w-5 h-5 text-cyan-600 border-2 border-gray-300 rounded focus:ring-cyan-500 mr-4"
                      />
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🧽</span>
                        <div>
                          <span className="text-sm font-semibold text-cyan-800">Sistema de Lavadero</span>
                          <p className="text-xs text-cyan-600">Servicios de lavado profesional</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setMessage('🗄️ Funcionalidad de respaldo en desarrollo')}
                    className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg p-4 text-left transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💾</span>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Hacer Respaldo</span>
                        <p className="text-xs text-gray-500">Crear copia de seguridad</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setMessage('📊 Panel de reportes en desarrollo')}
                    className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg p-4 text-left transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">Ver Reportes</span>
                        <p className="text-xs text-gray-500">Análisis de datos</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Botón de guardar mejorado */}
            <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={saveConfiguration}
                disabled={loading}
                className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <Save className="h-5 w-5" />
                <span>{loading ? 'Guardando Configuración...' : 'Guardar Configuración'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Administrador de Base de Datos */}
        <div className="mt-8">
          <DatabaseAdmin />
        </div>

        {/* Historial Detallado de Entradas y Salidas con Filtros */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-3">
              <span className="text-2xl">📋</span>
              <span>Historial Detallado de Operaciones</span>
            </h2>
            <p className="text-emerald-100 mt-2">Registro completo de entradas, salidas y servicios con filtros avanzados</p>
          </div>
          
          <div className="p-6">
            {/* Componente de filtros */}
            <DateRangePicker 
              onRangeChange={(range) => loadData(range as any)}
              className="mb-6"
            />

            <div className="grid md:grid-cols-2 gap-8">
              {/* Historial de Parqueadero */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🚗</span>
                    <span>Historial de Parqueadero</span>
                  </div>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {parkingRecords.length} registros
                  </span>
                </h3>
                
                {/* Botón de Recalcular Montos */}
                <button
                  onClick={async () => {
                    if (confirm('¿Desea recalcular todos los montos de parqueadero según el tiempo real? Esto actualizará TODOS los registros completados del historial.')) {
                      setLoading(true);
                      try {
                        let updatedCount = 0;
                        
                        // Cargar TODOS los registros del historial (vehicle_history)
                        const allHistoryRecords = await dualDB.getParkingHistory();
                        console.log('📊 Total registros en historial:', allHistoryRecords.length);
                        
                        for (const record of allHistoryRecords) {
                          // Solo procesar registros completados con entrada y salida
                          const hasValidTimes = record.entryTime && record.exitTime;
                          const isCompleted = record.status === 'completed' || record.estado === 'Salió' || record.estado === 'Completado';
                          
                          if (hasValidTimes && isCompleted) {
                            // Calcular tiempo exacto
                            const entryTime = record.entryTime instanceof Date ? record.entryTime : new Date(record.entryTime);
                            const exitTime = record.exitTime instanceof Date ? record.exitTime : new Date(record.exitTime);
                            const diffMs = exitTime.getTime() - entryTime.getTime();
                            const totalMinutes = Math.floor(diffMs / 60000);
                            
                            if (totalMinutes < 0) {
                              console.warn('⚠️ Registro con tiempo negativo:', record.id || record.placa);
                              continue;
                            }
                            
                            // Obtener tarifa por hora según tipo de vehículo
                            let hourlyRate = 3000; // Default para carro
                            const vehicleType = record.vehicleType || 'car';
                            
                            if (vehicleType === 'motorcycle') {
                              hourlyRate = config?.motorcycleParkingRate || 2000;
                            } else if (vehicleType === 'truck') {
                              hourlyRate = config?.truckParkingRate || 4000;
                            } else if (vehicleType === 'car') {
                              hourlyRate = config?.carParkingRate || 3000;
                            }
                            
                            // Calcular precio con sistema de MEDIAS HORAS
                            const fullHours = Math.floor(totalMinutes / 60);
                            const remainingMinutes = totalMinutes % 60;
                            
                            let correctAmount = 0;
                            
                            // Cobrar las horas completas
                            correctAmount += fullHours * hourlyRate;
                            
                            // Cobrar la fracción restante
                            if (remainingMinutes > 0) {
                              if (remainingMinutes <= 29) {
                                // 1-29 minutos = mitad del precio (media hora)
                                correctAmount += hourlyRate / 2;
                              } else {
                                // 30-60 minutos = precio completo (hora completa)
                                correctAmount += hourlyRate;
                              }
                            }
                            
                            // Obtener el monto actual (puede estar en diferentes campos)
                            const currentAmount = record.totalAmount || record.cobro || 0;
                            
                            // Solo actualizar si el monto es diferente
                            if (currentAmount !== correctAmount) {
                              console.log(`🔄 Actualizando ${record.placa}: $${currentAmount} → $${correctAmount} (${totalMinutes}min)`);
                              
                              const updatedRecord = {
                                ...record,
                                totalAmount: correctAmount,
                                cobro: correctAmount, // También actualizar el campo cobro
                                totalMinutes: totalMinutes
                              };
                              
                              // Guardar en vehicle_history
                              await dualDB.saveParkingRecord(updatedRecord);
                              updatedCount++;
                            }
                          }
                        }
                        
                        // Recargar datos con el rango de fechas actual del filtro
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const endOfDay = new Date(today);
                        endOfDay.setHours(23, 59, 59, 999);
                        
                        await loadData({ from: today, to: endOfDay, filter: 'today' });
                        setMessage(`✅ ${updatedCount} registros actualizados con montos correctos`);
                      } catch (error) {
                        console.error('Error recalculando montos:', error);
                        setMessage('❌ Error al recalcular montos');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="mb-3 w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <span>🔄</span>
                  <span className="font-semibold">
                    {loading ? 'Recalculando...' : 'Recalcular Todos los Montos'}
                  </span>
                </button>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {historyLoading ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2">Cargando datos...</p>
                    </div>
                  ) : parkingRecords.length > 0 ? (
                    <div className="space-y-3">
                      {parkingRecords.map((record) => (
                        <div key={record.id} className={`bg-white p-4 rounded border ${
                          record.status === 'active' ? 'border-yellow-300' : 'border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-semibold text-blue-700">{record.placa}</span>
                              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {record.vehicleType === 'car' ? '🚗 Carro' :
                                 record.vehicleType === 'motorcycle' ? '🏍️ Moto' : '🚛 Camión'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {record.status === 'completed' && (
                                <span className="text-sm font-semibold text-green-600">
                                  ${record.totalAmount?.toLocaleString()}
                                </span>
                              )}
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setEditType('parking');
                                    setEditModalOpen(true);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('¿Está seguro de eliminar este registro?')) {
                                      const result = await deleteParkingRecord(record.id);
                                      setMessage(result.success ? '✅ ' + result.message : '❌ ' + result.message);
                                    }
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>� Entrada:</span>
                              <span>{record.entryTime.toLocaleString('es-CO')}</span>
                            </div>
                            {record.exitTime && (
                              <div className="flex justify-between">
                                <span>📤 Salida:</span>
                                <span>{record.exitTime.toLocaleString('es-CO')}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold">
                              <span>⏱️ Tiempo:</span>
                              <span>
                                {record.totalMinutes ? `${Math.floor(record.totalMinutes / 60)}h ${record.totalMinutes % 60}m` : 'En curso'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>💳 Estado:</span>
                              <span className={record.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                                {record.status === 'completed' ? '✅ Completado' : 
                                 record.status === 'active' ? '🔄 Activo' : '❌ Cancelado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <span className="text-4xl">🚗</span>
                      <p className="mt-2">No hay registros de parqueadero en este período</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Historial de Lavadero */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🧽</span>
                    <span>Historial de Lavadero</span>
                  </div>
                  <span className="text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                    {carwashRecords.length} registros
                  </span>
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {historyLoading ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                      <p className="mt-2">Cargando datos...</p>
                    </div>
                  ) : carwashRecords.length > 0 ? (
                    <div className="space-y-3">
                      {carwashRecords.map((record) => (
                        <div key={record.id} className={`bg-white p-4 rounded border ${
                          record.status === 'in_progress' ? 'border-blue-300' : 'border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-semibold text-cyan-700">{record.placa}</span>
                              <span className="ml-2 text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                                {record.vehicleType === 'car' ? '🚗 Carro' :
                                 record.vehicleType === 'motorcycle' ? '🏍️ Moto' : '🚛 Camión'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {record.status === 'completed' && (
                                <span className="text-sm font-semibold text-green-600">
                                  ${record.basePrice.toLocaleString()}
                                </span>
                              )}
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setEditType('carwash');
                                    setEditModalOpen(true);
                                  }}
                                  className="p-1 text-cyan-600 hover:bg-cyan-100 rounded"
                                  title="Ver detalles"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('¿Está seguro de eliminar este registro?')) {
                                      const result = await deleteCarwashRecord(record.id);
                                      setMessage(result.success ? '✅ ' + result.message : '❌ ' + result.message);
                                    }
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>🧽 Servicio:</span>
                              <span>{record.serviceName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>👨‍🔧 Trabajador:</span>
                              <span>{record.workerName} ({record.workerPercentage}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>📅 Inicio:</span>
                              <span>{record.startTime.toLocaleString('es-CO')}</span>
                            </div>
                            {record.endTime && (
                              <div className="flex justify-between">
                                <span>✅ Finalizado:</span>
                                <span>{record.endTime.toLocaleString('es-CO')}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold">
                              <span>💰 Comisión trabajador:</span>
                              <span className="text-blue-600">${record.workerCommission.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>🏢 Ganancia empresa:</span>
                              <span className="text-green-600">${record.companyEarning.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>📊 Estado:</span>
                              <span className={
                                record.status === 'completed' ? 'text-green-600' : 
                                record.status === 'in_progress' ? 'text-blue-600' : 
                                'text-yellow-600'
                              }>
                                {record.status === 'completed' ? '✅ Completado' : 
                                 record.status === 'in_progress' ? '🔄 En progreso' :
                                 record.status === 'pending' ? '⏳ Pendiente' : '❌ Cancelado'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <span className="text-4xl">🧽</span>
                      <p className="mt-2">No hay registros de lavadero en este período</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen de ingresos dinámico */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <span className="text-xl">💰</span>
                <span>Resumen de Ingresos del Período</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-800">🚗 Parqueadero</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        ${dailySummary.parkingRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-600">{dailySummary.parkingTransactions} vehículos</p>
                    </div>
                    <span className="text-3xl text-blue-500">🚗</span>
                  </div>
                </div>
                
                <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-cyan-800">🧽 Lavadero</h4>
                      <p className="text-2xl font-bold text-cyan-600">
                        ${dailySummary.carwashRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-cyan-600">{dailySummary.carwashTransactions} servicios</p>
                    </div>
                    <span className="text-3xl text-cyan-500">🧽</span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800">💰 Total</h4>
                      <p className="text-2xl font-bold text-green-600">
                        ${dailySummary.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600">{dailySummary.totalTransactions} operaciones</p>
                    </div>
                    <span className="text-3xl text-green-500">💰</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 🧽 Modal para Agregar Servicio de Lavadero */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🧽</span>
                  Agregar Nuevo Servicio
                </h2>
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-cyan-100 mt-2 text-sm">Configura un nuevo servicio de lavadero</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Tipo de Vehículo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🚗 Tipo de Vehículo
                </label>
                <select
                  value={newService.vehicleType || vehicleTypes[0]?.id || ''}
                  onChange={(e) => setNewService({...newService, vehicleType: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {vehicleTypes.map((vt) => {
                    const iconEmoji = iconMap[vt.iconName] || '🚗';
                    return (
                      <option key={vt.id} value={vt.id}>
                        {iconEmoji} {vt.name} (${vt.tarifa?.toLocaleString()}/hora)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Nombre del Servicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ✨ Nombre del Servicio
                </label>
                <input
                  type="text"
                  value={newService.serviceName}
                  onChange={(e) => setNewService({...newService, serviceName: e.target.value})}
                  placeholder="Ej: Lavado Básico, Detallado Completo, etc."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Precio Base */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💰 Precio Base
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
                  <input
                    type="number"
                    value={newService.basePrice}
                    onChange={(e) => setNewService({...newService, basePrice: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Tiempo Estimado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⏱️ Tiempo Estimado (minutos)
                </label>
                <input
                  type="number"
                  value={newService.estimatedTime}
                  onChange={(e) => setNewService({...newService, estimatedTime: parseInt(e.target.value) || 30})}
                  placeholder="30"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={addCarwashService}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700 font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  ✅ Agregar Servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {editType === 'parking' ? '🚗 Editar Registro de Parqueadero' : '🧽 Detalles de Servicio de Lavado'}
                </h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {editType === 'parking' ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Placa</label>
                      <input
                        type="text"
                        value={editingRecord.placa}
                        onChange={(e) => setEditingRecord({...editingRecord, placa: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vehículo</label>
                      <select
                        value={editingRecord.vehicleType}
                        onChange={(e) => setEditingRecord({...editingRecord, vehicleType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {vehicleTypes.map((vt) => {
                          const iconEmoji = iconMap[vt.iconName] || '🚗';
                          return (
                            <option key={vt.id} value={vt.id}>
                              {iconEmoji} {vt.name} (${vt.tarifa?.toLocaleString()}/hora)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select
                        value={editingRecord.status}
                        onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">🔄 Activo</option>
                        <option value="completed">✅ Completado</option>
                        <option value="cancelled">❌ Cancelado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monto Total</label>
                      <input
                        type="number"
                        value={editingRecord.totalAmount || ''}
                        onChange={(e) => setEditingRecord({...editingRecord, totalAmount: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Entrada</label>
                      <input
                        type="datetime-local"
                        value={editingRecord.entryTime ? new Date(editingRecord.entryTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const newEntry = new Date(e.target.value);
                          const updatedRecord = {...editingRecord, entryTime: newEntry};
                          
                          // ✅ Recalcular automáticamente si hay entrada y salida
                          if (editingRecord.exitTime) {
                            const newAmount = recalculateParkingAmount(
                              newEntry, 
                              new Date(editingRecord.exitTime), 
                              editingRecord.vehicleType
                            );
                            updatedRecord.totalAmount = newAmount;
                          }
                          
                          setEditingRecord(updatedRecord);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Salida</label>
                      <input
                        type="datetime-local"
                        value={editingRecord.exitTime ? new Date(editingRecord.exitTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => {
                          const newExit = e.target.value ? new Date(e.target.value) : null;
                          const updatedRecord = {...editingRecord, exitTime: newExit};
                          
                          // ✅ Recalcular automáticamente si hay entrada y salida
                          if (editingRecord.entryTime && newExit) {
                            const newAmount = recalculateParkingAmount(
                              new Date(editingRecord.entryTime), 
                              newExit, 
                              editingRecord.vehicleType
                            );
                            updatedRecord.totalAmount = newAmount;
                          }
                          
                          setEditingRecord(updatedRecord);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRecord.isPaid}
                        onChange={(e) => setEditingRecord({...editingRecord, isPaid: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">¿Está pagado?</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setEditModalOpen(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        const result = await updateParkingRecord(editingRecord.id, editingRecord);
                        setMessage(result.success ? '✅ ' + result.message : '❌ ' + result.message);
                        setEditModalOpen(false);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Información del Servicio</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Placa:</span>
                        <span className="ml-2 font-semibold">{editingRecord.placa}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Vehículo:</span>
                        <span className="ml-2">
                          {(() => {
                            const vt = vehicleTypes.find(v => v.id === editingRecord.vehicleType || v.name === editingRecord.vehicleType);
                            const iconEmoji = iconMap[vt?.iconName || ''] || '🚗';
                            return vt ? `${iconEmoji} ${vt.name}` : (oldTypeNames[editingRecord.vehicleType] || editingRecord.vehicleType);
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Servicio:</span>
                        <span className="ml-2">{editingRecord.serviceName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Precio:</span>
                        <span className="ml-2 font-semibold text-green-600">${editingRecord.basePrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Trabajador:</span>
                        <span className="ml-2">{editingRecord.workerName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Comisión:</span>
                        <span className="ml-2">{editingRecord.workerPercentage}%</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Inicio:</span>
                        <span className="ml-2">{editingRecord.startTime.toLocaleString('es-CO')}</span>
                      </div>
                      {editingRecord.endTime && (
                        <div>
                          <span className="font-medium text-gray-600">Finalizado:</span>
                          <span className="ml-2">{editingRecord.endTime.toLocaleString('es-CO')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Distribución de Ganancias</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Comisión Trabajador</p>
                        <p className="text-xl font-bold text-blue-600">
                          ${editingRecord.workerCommission.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Ganancia Empresa</p>
                        <p className="text-xl font-bold text-green-600">
                          ${editingRecord.companyEarning.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditModalOpen(false)}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessConfigurationPanel;