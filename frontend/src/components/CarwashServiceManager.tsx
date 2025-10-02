'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Clock, DollarSign, Car, Bike, Truck } from 'lucide-react';
import { getDualDB, CarwashService } from '../lib/dualDatabase';
import { getLocalDB, VehicleTypeConfig } from '@/lib/localDatabase';
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';

interface CarwashServiceManagerProps {
  onServiceChange?: () => void;
}

export default function CarwashServiceManager({ onServiceChange }: CarwashServiceManagerProps) {
  const [services, setServices] = useState<CarwashService[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<CarwashService | null>(null);
  const [message, setMessage] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState({
    vehicleType: 'car',
    serviceName: '',
    basePrice: 0,
    estimatedTime: 30
  });

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
      console.log('✅ Tipos de vehículos cargados en lavadero:', allTypes.length);
      console.log('📋 Tipos predeterminados:', defaultTypes.length);
      console.log('🎨 Tipos personalizados:', customTypes.length);
      console.log('📝 Lista completa:', allTypes.map(t => `${t.name} (${t.id})`).join(', '));
    } catch (error) {
      console.error('❌ Error cargando tipos de vehículos:', error);
    }
  };

  // Cargar servicios
  const loadServices = async () => {
    setLoading(true);
    try {
      const dualDB = getDualDB();
      const allServices = await dualDB.getAllCarwashServices();
      setServices(allServices || []);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setMessage('❌ Error cargando servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadVehicleTypes();
  }, []);

  // Escuchar eventos de cambios en tipos de vehículos
  useEffect(() => {
    const handleVehicleTypeChange = () => {
      console.log('📢 Evento de cambio de tipo de vehículo recibido en lavadero, recargando...');
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

  // Resetear formulario
  const resetForm = () => {
    const firstVehicleType = vehicleTypes.length > 0 ? vehicleTypes[0].id : 'car';
    setFormData({
      vehicleType: firstVehicleType,
      serviceName: '',
      basePrice: 0,
      estimatedTime: 30
    });
    setEditingService(null);
  };

  // Abrir modal para nuevo servicio
  const openNewServiceModal = async () => {
    await loadVehicleTypes(); // Recargar tipos antes de abrir modal
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar servicio
  const openEditModal = async (service: CarwashService) => {
    await loadVehicleTypes(); // Recargar tipos antes de abrir modal
    setFormData({
      vehicleType: service.vehicleType,
      serviceName: service.serviceName,
      basePrice: service.basePrice,
      estimatedTime: service.estimatedTime
    });
    setEditingService(service);
    setShowModal(true);
  };

  // Guardar servicio
  const saveService = async () => {
    if (!formData.serviceName.trim()) {
      setMessage('❌ El nombre del servicio es requerido');
      return;
    }

    if (formData.basePrice <= 0) {
      setMessage('❌ El precio debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const dualDB = getDualDB();
      
      if (editingService) {
        // Actualizar servicio existente
        const updatedService = {
          ...editingService,
          vehicleType: formData.vehicleType,
          serviceName: formData.serviceName,
          basePrice: formData.basePrice,
          estimatedTime: formData.estimatedTime,
          updatedAt: new Date()
        };
        await dualDB.updateCarwashService(updatedService);
        setMessage('✅ Servicio actualizado correctamente');
      } else {
        // Crear nuevo servicio
        const newService: CarwashService = {
          id: `service_${Date.now()}`,
          vehicleType: formData.vehicleType,
          serviceName: formData.serviceName,
          basePrice: formData.basePrice,
          estimatedTime: formData.estimatedTime,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await dualDB.saveCarwashService(newService);
        setMessage('✅ Servicio creado correctamente');
      }
      
      setShowModal(false);
      resetForm();
      await loadServices();
      
      if (onServiceChange) {
        onServiceChange();
      }
    } catch (error) {
      console.error('Error guardando servicio:', error);
      setMessage('❌ Error guardando el servicio');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar servicio
  const deleteService = async (serviceId: string) => {
    if (!confirm('¿Está seguro de eliminar este servicio?')) {
      return;
    }

    setLoading(true);
    try {
      const dualDB = getDualDB();
      await dualDB.deleteCarwashService(serviceId);
      setMessage('✅ Servicio eliminado correctamente');
      await loadServices();
      
      if (onServiceChange) {
        onServiceChange();
      }
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      setMessage('❌ Error eliminando el servicio');
    } finally {
      setLoading(false);
    }
  };

  // Toggle estado activo/inactivo
  const toggleServiceStatus = async (service: CarwashService) => {
    setLoading(true);
    try {
      const dualDB = getDualDB();
      const updatedService = {
        ...service,
        isActive: !service.isActive,
        updatedAt: new Date()
      };
      await dualDB.updateCarwashService(updatedService);
      setMessage(`✅ Servicio ${updatedService.isActive ? 'activado' : 'desactivado'} correctamente`);
      await loadServices();
      
      if (onServiceChange) {
        onServiceChange();
      }
    } catch (error) {
      console.error('Error actualizando estado del servicio:', error);
      setMessage('❌ Error actualizando el servicio');
    } finally {
      setLoading(false);
    }
  };

  // Obtener icono por tipo de vehículo
  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'car': return <Car className="h-5 w-5" />;
      case 'motorcycle': return <Bike className="h-5 w-5" />;
      case 'truck': return <Truck className="h-5 w-5" />;
      default: return <Car className="h-5 w-5" />;
    }
  };

  // Obtener texto por tipo de vehículo
  const getVehicleText = (vehicleType: string) => {
    const vehicleTypeObj = vehicleTypes.find(vt => vt.id === vehicleType);
    if (vehicleTypeObj) {
      const emojis: Record<string, string> = {
        'car': '🚗',
        'motorcycle': '🏍️',
        'truck': '🚛'
      };
      const emoji = emojis[vehicleType] || '🚙';
      return `${emoji} ${vehicleTypeObj.name}`;
    }
    
    // Fallback para tipos antiguos
    switch (vehicleType) {
      case 'car': return '🚗 Automóvil';
      case 'motorcycle': return '🏍️ Motocicleta';
      case 'truck': return '🚛 Camión';
      default: return '� ' + vehicleType;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-3">
              <span className="text-2xl">🧽</span>
              <span>Gestión de Servicios de Lavadero</span>
            </h2>
            <p className="text-cyan-100 mt-2">Administra los servicios disponibles para cada tipo de vehículo</p>
          </div>
          <button
            onClick={openNewServiceModal}
            className="flex items-center space-x-2 bg-white text-cyan-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 ${
          message.includes('✅') ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            message.includes('✅') ? 'text-green-700' : 'text-red-700'
          }`}>
            {message}
          </p>
        </div>
      )}

      {/* Lista de servicios */}
      <div className="p-6">
        {loading && !showModal ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando servicios...</p>
          </div>
        ) : services.length > 0 ? (
          <div className="grid gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className={`p-4 rounded-lg border ${
                  service.isActive 
                    ? 'border-gray-200 bg-white' 
                    : 'border-gray-300 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      service.vehicleType === 'car' ? 'bg-blue-100 text-blue-600' :
                      service.vehicleType === 'motorcycle' ? 'bg-orange-100 text-orange-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {getVehicleIcon(service.vehicleType)}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800">{service.serviceName}</h3>
                      <p className="text-sm text-gray-600">{getVehicleText(service.vehicleType)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-green-600">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-bold">${service.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-blue-600 text-sm">
                        <Clock className="h-3 w-3" />
                        <span>{service.estimatedTime} min</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleServiceStatus(service)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          service.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                      
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar servicio"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteService(service.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar servicio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl">🧽</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-4">No hay servicios configurados</h3>
            <p className="text-gray-600 mt-2">Agrega tu primer servicio de lavadero</p>
            <button
              onClick={openNewServiceModal}
              className="mt-4 flex items-center space-x-2 mx-auto bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Primer Servicio</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal para nuevo/editar servicio */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-6 rounded-t-xl">
              <h2 className="text-xl font-bold text-white">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Tipo de Vehículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Vehículo *
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                    💡 <strong>{vehicleTypes.length}</strong> tipo(s) de vehículo disponible(s) - Los tipos personalizados agregados en "Gestión de Parqueadero" aparecen automáticamente aquí
                  </p>
                )}
              </div>

              {/* Nombre del Servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Ej: Lavado Básico Completo"
                />
              </div>

              {/* Precio Base */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Base *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.basePrice || ''}
                    onChange={(e) => setFormData({...formData, basePrice: parseInt(e.target.value) || 0})}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Tiempo Estimado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo Estimado (minutos) *
                </label>
                <input
                  type="number"
                  value={formData.estimatedTime || ''}
                  onChange={(e) => setFormData({...formData, estimatedTime: parseInt(e.target.value) || 30})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="30"
                  min="1"
                />
              </div>
            </div>

            {/* Botones del modal */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveService}
                disabled={loading}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{editingService ? 'Actualizar' : 'Crear'} Servicio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}