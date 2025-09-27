'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  Car,
  Droplets,
  DollarSign,
  Clock,
  Users,
  MapPin,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
  User,
  Percent
} from 'lucide-react';
import { getDualDB, Worker, CarwashService } from '@/lib/dualDatabase';
import toast from 'react-hot-toast';

interface ConfigurationData {
  parking: {
    hourlyRate: number;
    dailyRate: number;
    monthlyRate: number;
    maxSpaces: number;
    openingHours: {
      start: string;
      end: string;
    };
  };
  carwash: {
    defaultWorkerPercentage: number;
    maxActiveOrders: number;
    autoAssignWorkers: boolean;
  };
  general: {
    businessName: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
  };
}

const ConfigurationPanel: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState<ConfigurationData>({
    parking: {
      hourlyRate: 2000,
      dailyRate: 15000,
      monthlyRate: 200000,
      maxSpaces: 50,
      openingHours: {
        start: '06:00',
        end: '22:00'
      }
    },
    carwash: {
      defaultWorkerPercentage: 30,
      maxActiveOrders: 10,
      autoAssignWorkers: false
    },
    general: {
      businessName: 'Sistema POS',
      address: '',
      phone: '',
      email: '',
      currency: 'COP'
    }
  });

  // Workers and services management
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<CarwashService[]>([]);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingService, setEditingService] = useState<CarwashService | null>(null);

  const [newWorkerData, setNewWorkerData] = useState({
    name: '',
    phone: '',
    percentage: 30,
    isActive: true
  });

  const [newServiceData, setNewServiceData] = useState({
    vehicleType: 'car',
    serviceName: '',
    basePrice: 0,
    estimatedTime: 30,
    isActive: true
  });

  useEffect(() => {
    loadData();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dualDB = getDualDB();
      const [workersData, servicesData] = await Promise.all([
        dualDB.getAllWorkers(),
        dualDB.getAllCarwashServices()
      ]);
      
      setWorkers(workersData);
      setServices(servicesData);

      // Load saved configuration from localStorage
      const savedConfig = localStorage.getItem('systemConfiguration');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      // Save to localStorage
      localStorage.setItem('systemConfiguration', JSON.stringify(config));
      
      toast.success(`Configuración guardada ${isOnline ? 'y sincronizada' : '(sin conexión)'}`);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const resetConfiguration = () => {
    setConfig({
      parking: {
        hourlyRate: 2000,
        dailyRate: 15000,
        monthlyRate: 200000,
        maxSpaces: 50,
        openingHours: {
          start: '06:00',
          end: '22:00'
        }
      },
      carwash: {
        defaultWorkerPercentage: 30,
        maxActiveOrders: 10,
        autoAssignWorkers: false
      },
      general: {
        businessName: 'Sistema POS',
        address: '',
        phone: '',
        email: '',
        currency: 'COP'
      }
    });
    toast.success('Configuración restablecida');
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWorkerData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      const workerData = {
        ...newWorkerData,
        createdAt: new Date()
      };

      const dualDB = getDualDB();
      if (editingWorker) {
        await dualDB.updateWorker({ ...workerData, id: editingWorker.id });
        toast.success(`Trabajador actualizado ${isOnline ? '' : '(sin conexión)'}`);
      } else {
        await dualDB.saveWorker(workerData);
        toast.success(`Trabajador agregado ${isOnline ? '' : '(sin conexión)'}`);
      }

      await loadData();
      setShowAddWorkerModal(false);
      setEditingWorker(null);
      setNewWorkerData({ name: '', phone: '', percentage: 30, isActive: true });
    } catch (error) {
      console.error('Error adding worker:', error);
      toast.error('Error al agregar trabajador');
    }
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setNewWorkerData({
      name: worker.name,
      phone: worker.phone || '',
      percentage: worker.percentage,
      isActive: worker.isActive
    });
    setShowAddWorkerModal(true);
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm('¿Está seguro de eliminar este trabajador?')) return;

    try {
      const dualDB = getDualDB();
      const worker = await dualDB.getWorker(workerId);
      if (worker) {
        await dualDB.updateWorker({ ...worker, isActive: false });
        toast.success('Trabajador desactivado');
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting worker:', error);
      toast.error('Error al eliminar trabajador');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newServiceData.serviceName.trim() || newServiceData.basePrice <= 0) {
      toast.error('Nombre y precio son requeridos');
      return;
    }

    try {
      const serviceData = {
        ...newServiceData,
        createdAt: new Date()
      };

      const dualDB = getDualDB();
      if (editingService) {
        await dualDB.updateCarwashService({ ...serviceData, id: editingService.id });
        toast.success(`Servicio actualizado ${isOnline ? '' : '(sin conexión)'}`);
      } else {
        await dualDB.saveCarwashService(serviceData);
        toast.success(`Servicio agregado ${isOnline ? '' : '(sin conexión)'}`);
      }

      await loadData();
      setShowAddServiceModal(false);
      setEditingService(null);
      setNewServiceData({ vehicleType: 'car', serviceName: '', basePrice: 0, estimatedTime: 30, isActive: true });
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Error al agregar servicio');
    }
  };

  const handleEditService = (service: CarwashService) => {
    setEditingService(service);
    setNewServiceData({
      vehicleType: service.vehicleType,
      serviceName: service.serviceName,
      basePrice: service.basePrice,
      estimatedTime: service.estimatedTime,
      isActive: service.isActive
    });
    setShowAddServiceModal(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Está seguro de eliminar este servicio?')) return;

    try {
      const dualDB = getDualDB();
      const service = await dualDB.getCarwashService(serviceId);
      if (service) {
        await dualDB.updateCarwashService({ ...service, isActive: false });
      }
      toast.success('Servicio desactivado');
      await loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar servicio');
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'parking', name: 'Parqueadero', icon: Car },
    { id: 'carwash', name: 'Lavadero', icon: Droplets },
    { id: 'workers', name: 'Trabajadores', icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600">Administra la configuración general del negocio</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
            {isOnline ? 'En línea' : 'Sin conexión'}
          </div>
          
          <button
            onClick={resetConfiguration}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </button>
          
          <button
            onClick={saveConfiguration}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'general' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Negocio
                  </label>
                  <input
                    type="text"
                    value={config.general.businessName}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, businessName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={config.general.phone}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.general.email}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    value={config.general.currency}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, currency: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="COP">Pesos Colombianos (COP)</option>
                    <option value="USD">Dólares (USD)</option>
                    <option value="EUR">Euros (EUR)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={config.general.address}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general, address: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parking' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Configuración del Parqueadero</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarifa por Hora (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={config.parking.hourlyRate}
                    onChange={(e) => setConfig({
                      ...config,
                      parking: { ...config.parking, hourlyRate: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarifa por Día (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={config.parking.dailyRate}
                    onChange={(e) => setConfig({
                      ...config,
                      parking: { ...config.parking, dailyRate: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarifa Mensual (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={config.parking.monthlyRate}
                    onChange={(e) => setConfig({
                      ...config,
                      parking: { ...config.parking, monthlyRate: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Espacios Máximos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={config.parking.maxSpaces}
                    onChange={(e) => setConfig({
                      ...config,
                      parking: { ...config.parking, maxSpaces: parseInt(e.target.value) || 1 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Apertura
                  </label>
                  <input
                    type="time"
                    value={config.parking.openingHours.start}
                    onChange={(e) => setConfig({
                      ...config,
                      parking: { 
                        ...config.parking, 
                        openingHours: { ...config.parking.openingHours, start: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Cierre
                  </label>
                  <input
                    type="time"
                    value={config.parking.openingHours.end}
                    onChange={(e) => setConfig({
                      ...config,
                      parking: { 
                        ...config.parking, 
                        openingHours: { ...config.parking.openingHours, end: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'carwash' && (
            <div className="space-y-6">
              {/* Configuración general del lavadero */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Configuración del Lavadero</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porcentaje por Defecto para Trabajadores (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={config.carwash.defaultWorkerPercentage}
                      onChange={(e) => setConfig({
                        ...config,
                        carwash: { ...config.carwash, defaultWorkerPercentage: parseInt(e.target.value) || 30 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo de Órdenes Activas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={config.carwash.maxActiveOrders}
                      onChange={(e) => setConfig({
                        ...config,
                        carwash: { ...config.carwash, maxActiveOrders: parseInt(e.target.value) || 10 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.carwash.autoAssignWorkers}
                        onChange={(e) => setConfig({
                          ...config,
                          carwash: { ...config.carwash, autoAssignWorkers: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Asignar trabajadores automáticamente
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Servicios disponibles */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Servicios de Lavado</h2>
                  <button
                    onClick={() => setShowAddServiceModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Servicio
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.filter(s => s.isActive).map(service => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{service.serviceName}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Vehículo: {service.vehicleType === 'car' ? 'Automóvil' : service.vehicleType === 'motorcycle' ? 'Motocicleta' : 'Camión'}</p>
                        <p>Precio: ${service.basePrice.toLocaleString()}</p>
                        <p>Tiempo: {service.estimatedTime} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workers' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Trabajadores de Lavadero</h2>
                <button
                  onClick={() => setShowAddWorkerModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Trabajador
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.filter(w => w.isActive).map(worker => (
                  <div key={worker.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <h3 className="font-medium">{worker.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditWorker(worker)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {worker.phone && <p>Tel: {worker.phone}</p>}
                      <div className="flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        <span className="font-medium text-green-600">{worker.percentage}%</span>
                      </div>
                      <p className="text-xs">
                        Agregado: {new Date(worker.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {workers.filter(w => w.isActive).length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay trabajadores registrados</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal para agregar/editar trabajador */}
      <AnimatePresence>
        {showAddWorkerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingWorker ? 'Editar Trabajador' : 'Registrar Trabajador'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddWorkerModal(false);
                    setEditingWorker(null);
                    setNewWorkerData({ name: '', phone: '', percentage: 30, isActive: true });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddWorker} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWorkerData.name}
                    onChange={(e) => setNewWorkerData({...newWorkerData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={newWorkerData.phone}
                    onChange={(e) => setNewWorkerData({...newWorkerData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 300 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Porcentaje de Comisión (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="90"
                    value={newWorkerData.percentage}
                    onChange={(e) => setNewWorkerData({...newWorkerData, percentage: parseInt(e.target.value) || 30})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Porcentaje que recibe el trabajador por cada servicio
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddWorkerModal(false);
                      setEditingWorker(null);
                      setNewWorkerData({ name: '', phone: '', percentage: 30, isActive: true });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    {editingWorker ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal para agregar/editar servicio */}
      <AnimatePresence>
        {showAddServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddServiceModal(false);
                    setEditingService(null);
                    setNewServiceData({ vehicleType: 'car', serviceName: '', basePrice: 0, estimatedTime: 30, isActive: true });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Vehículo *
                  </label>
                  <select
                    value={newServiceData.vehicleType}
                    onChange={(e) => setNewServiceData({...newServiceData, vehicleType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="car">Automóvil</option>
                    <option value="motorcycle">Motocicleta</option>
                    <option value="truck">Camión</option>
                  </select>
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
                    Precio Base (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={newServiceData.basePrice}
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
                    value={newServiceData.estimatedTime}
                    onChange={(e) => setNewServiceData({...newServiceData, estimatedTime: parseInt(e.target.value) || 30})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 30"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddServiceModal(false);
                      setEditingService(null);
                      setNewServiceData({ vehicleType: 'car', serviceName: '', basePrice: 0, estimatedTime: 30, isActive: true });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {editingService ? 'Actualizar' : 'Crear'}
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

export default ConfigurationPanel;