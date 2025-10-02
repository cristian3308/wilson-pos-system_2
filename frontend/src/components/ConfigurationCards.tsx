'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Building2, Car, Truck, Bike, DollarSign, Clock, Check, X, Plus, Edit3, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { getDualDB, BusinessConfig } from '../lib/dualDatabase';
import { getLocalDB, VehicleTypeConfig } from '@/lib/localDatabase';
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';

interface ConfigurationCardsProps {
  config: BusinessConfig;
  onConfigUpdate: (field: keyof BusinessConfig, value: any) => void;
  onTicketDataUpdate: (field: string, value: any) => void;
  onSave: () => void;
  loading: boolean;
}

export default function ConfigurationCards({ 
  config, 
  onConfigUpdate, 
  onTicketDataUpdate, 
  onSave, 
  loading 
}: ConfigurationCardsProps) {
  
  // Estado para tipos de vehículos dinámicos
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeConfig[]>([]);
  const [editingVehicleType, setEditingVehicleType] = useState<string | null>(null);
  const [tempTarifa, setTempTarifa] = useState<number>(0);

  const loadVehicleTypes = async () => {
    try {
      const localDB = getLocalDB();
      const types = await localDB.getVehicleTypes();
      setVehicleTypes(types);
      console.log('✅ Tipos de vehículos cargados:', types.length);
    } catch (error) {
      console.error('Error cargando tipos de vehículos:', error);
    }
  };

  // Cargar tipos de vehículos al montar el componente y cuando cambie el config
  useEffect(() => {
    loadVehicleTypes();
  }, [config.updatedAt]); // Recargar cuando se actualice la configuración

  // Escuchar eventos de cambios en tipos de vehículos
  useEffect(() => {
    const handleVehicleTypeChange = () => {
      console.log('📢 Evento de cambio de tipo de vehículo recibido, recargando...');
      loadVehicleTypes();
    };

    // Suscribirse a los eventos
    appEvents.on(APP_EVENTS.VEHICLE_TYPE_ADDED, handleVehicleTypeChange);
    appEvents.on(APP_EVENTS.VEHICLE_TYPE_UPDATED, handleVehicleTypeChange);
    appEvents.on(APP_EVENTS.VEHICLE_TYPE_DELETED, handleVehicleTypeChange);

    // Cleanup al desmontar
    return () => {
      appEvents.off(APP_EVENTS.VEHICLE_TYPE_ADDED, handleVehicleTypeChange);
      appEvents.off(APP_EVENTS.VEHICLE_TYPE_UPDATED, handleVehicleTypeChange);
      appEvents.off(APP_EVENTS.VEHICLE_TYPE_DELETED, handleVehicleTypeChange);
    };
  }, []);

  const updateVehicleTypeRate = async (vehicleTypeId: string, newRate: number) => {
    try {
      const localDB = getLocalDB();
      await localDB.updateVehicleType(vehicleTypeId, { tarifa: newRate });
      await loadVehicleTypes(); // Recargar
      
      // Emitir evento para notificar a otros componentes
      appEvents.emit(APP_EVENTS.VEHICLE_TYPE_UPDATED, { id: vehicleTypeId, tarifa: newRate });
      
      console.log('✅ Tarifa actualizada');
    } catch (error) {
      console.error('Error actualizando tarifa:', error);
      alert('Error al actualizar la tarifa');
    }
  };

  const deleteVehicleType = async (vehicleTypeId: string) => {
    if (!confirm('¿Está seguro de eliminar este tipo de vehículo?')) {
      return;
    }

    try {
      const localDB = getLocalDB();
      await localDB.deleteVehicleType(vehicleTypeId);
      await loadVehicleTypes(); // Recargar
      
      // Emitir evento para notificar a otros componentes
      appEvents.emit(APP_EVENTS.VEHICLE_TYPE_DELETED, { id: vehicleTypeId });
      
      console.log('✅ Tipo de vehículo eliminado');
    } catch (error) {
      console.error('Error eliminando tipo de vehículo:', error);
      alert('Error al eliminar: ' + (error as Error).message);
    }
  };

  const handleStartEdit = (vehicleTypeId: string, currentTarifa: number) => {
    setEditingVehicleType(vehicleTypeId);
    setTempTarifa(currentTarifa);
  };

  const handleSaveEdit = async () => {
    if (editingVehicleType && tempTarifa > 0) {
      await updateVehicleTypeRate(editingVehicleType, tempTarifa);
      setEditingVehicleType(null);
      setTempTarifa(0);
    }
  };

  const handleCancelEdit = () => {
    setEditingVehicleType(null);
    setTempTarifa(0);
  };
  
  return (
    <div className="space-y-6">
      
      {/* Sección: Información Empresarial */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Configuración Empresarial</h2>
            <p className="text-sm text-gray-600">Datos generales de tu negocio</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Nombre del Negocio
            </label>
            <input
              type="text"
              value={config.businessName}
              onChange={(e) => onConfigUpdate('businessName', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="WILSON CARS & WASH"
            />
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={config.businessAddress}
              onChange={(e) => onConfigUpdate('businessAddress', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Calle 123 #45-67"
            />
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={config.businessPhone}
              onChange={(e) => onConfigUpdate('businessPhone', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="(601) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Sección: Tarifas de Parqueadero */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Tarifas Parqueadero</h3>
                <p className="text-sm text-blue-100">Configura las tarifas por hora de cada tipo de vehículo</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.parkingEnabled}
                onChange={(e) => onConfigUpdate('parkingEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-blue-400/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/30"></div>
            </label>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tarifas de tipos predeterminados */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Car className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-blue-900">Carro (por hora)</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 font-bold">$</span>
                <input
                  type="number"
                  value={config.carParkingRate}
                  onChange={(e) => onConfigUpdate('carParkingRate', parseInt(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-lg font-semibold text-gray-800"
                  placeholder="3000"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200 hover:border-orange-400 transition-all">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Bike className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-orange-900">Moto (por hora)</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 font-bold">$</span>
                <input
                  type="number"
                  value={config.motorcycleParkingRate}
                  onChange={(e) => onConfigUpdate('motorcycleParkingRate', parseInt(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border-2 border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-lg font-semibold text-gray-800"
                  placeholder="2000"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all">
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-purple-900">Camión (por hora)</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 font-bold">$</span>
                <input
                  type="number"
                  value={config.truckParkingRate}
                  onChange={(e) => onConfigUpdate('truckParkingRate', parseInt(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-lg font-semibold text-gray-800"
                  placeholder="4000"
                />
              </div>
            </div>

            {/* Tarifas de tipos personalizados con colores dinámicos */}
            {vehicleTypes.map((vehicleType, index) => {
              // Colores rotativos para tipos personalizados
              const colors = [
                { 
                  gradient: 'from-teal-50 to-teal-100', 
                  border: 'border-teal-200 hover:border-teal-400', 
                  iconBg: 'bg-teal-500', 
                  icon: 'text-white', 
                  text: 'text-teal-900', 
                  inputBorder: 'border-teal-300',
                  ring: 'focus:ring-teal-500',
                  dollarSign: 'text-teal-600'
                },
                { 
                  gradient: 'from-pink-50 to-pink-100', 
                  border: 'border-pink-200 hover:border-pink-400', 
                  iconBg: 'bg-pink-500', 
                  icon: 'text-white', 
                  text: 'text-pink-900', 
                  inputBorder: 'border-pink-300',
                  ring: 'focus:ring-pink-500',
                  dollarSign: 'text-pink-600'
                },
                { 
                  gradient: 'from-indigo-50 to-indigo-100', 
                  border: 'border-indigo-200 hover:border-indigo-400', 
                  iconBg: 'bg-indigo-500', 
                  icon: 'text-white', 
                  text: 'text-indigo-900', 
                  inputBorder: 'border-indigo-300',
                  ring: 'focus:ring-indigo-500',
                  dollarSign: 'text-indigo-600'
                },
                { 
                  gradient: 'from-amber-50 to-amber-100', 
                  border: 'border-amber-200 hover:border-amber-400', 
                  iconBg: 'bg-amber-500', 
                  icon: 'text-white', 
                  text: 'text-amber-900', 
                  inputBorder: 'border-amber-300',
                  ring: 'focus:ring-amber-500',
                  dollarSign: 'text-amber-600'
                },
                { 
                  gradient: 'from-rose-50 to-rose-100', 
                  border: 'border-rose-200 hover:border-rose-400', 
                  iconBg: 'bg-rose-500', 
                  icon: 'text-white', 
                  text: 'text-rose-900', 
                  inputBorder: 'border-rose-300',
                  ring: 'focus:ring-rose-500',
                  dollarSign: 'text-rose-600'
                },
              ];
              const colorScheme = colors[index % colors.length];

              return (
                <div key={vehicleType.id} className={`bg-gradient-to-br ${colorScheme.gradient} p-4 rounded-xl border-2 ${colorScheme.border} transition-all relative group`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 ${colorScheme.iconBg} rounded-lg`}>
                        <Truck className={`h-4 w-4 ${colorScheme.icon}`} />
                      </div>
                      <span className={`text-sm font-bold ${colorScheme.text}`}>
                        {vehicleType.name} (por hora)
                      </span>
                    </div>
                    {vehicleType.isCustom && (
                      <button
                        onClick={() => deleteVehicleType(vehicleType.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-all duration-200 shadow-sm"
                        title="Eliminar tipo personalizado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                      className={`w-full pl-8 pr-4 py-3 border-2 ${colorScheme.inputBorder} rounded-xl focus:outline-none focus:ring-2 ${colorScheme.ring} focus:border-${colorScheme.ring.split('-')[1]}-500 bg-white text-lg font-semibold text-gray-800`}
                      placeholder="2000"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sección: Sistema de Lavadero */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <span className="text-2xl">🧽</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Sistema Lavadero</h3>
                <p className="text-sm text-cyan-100">Gestión de servicios de lavado</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.carwashEnabled}
                onChange={(e) => onConfigUpdate('carwashEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-cyan-400/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/30"></div>
            </label>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-5 rounded-xl border-2 border-cyan-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-cyan-500 rounded-lg">
                <span className="text-xl">💧</span>
              </div>
              <span className="text-sm font-bold text-cyan-900">Estado del Sistema</span>
            </div>
            
            {config.carwashEnabled ? (
              <div className="flex items-center space-x-2 bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Sistema Operativo y Activo</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-red-100 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-semibold text-red-800">Sistema Deshabilitado</span>
              </div>
            )}
            
            <p className="text-xs text-cyan-700 mt-3 bg-white/60 p-2 rounded-lg">
              💡 Los servicios se configuran en la sección de gestión de servicios
            </p>
          </div>
        </div>
      </div>

      {/* Sección: Configuración de Tickets */}
      <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
            <span className="text-2xl">🎫</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Configuración de Tickets</h2>
            <p className="text-sm text-gray-600">Datos que aparecen en los tickets de impresión</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna 1: Datos de la empresa */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={config.ticketData?.companyName || ''}
                onChange={(e) => onTicketDataUpdate('companyName', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="WILSON CARS & WASH"
              />
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Subtítulo
              </label>
              <input
                type="text"
                value={config.ticketData?.companySubtitle || ''}
                onChange={(e) => onTicketDataUpdate('companySubtitle', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="PARKING PROFESSIONAL"
              />
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                NIT
              </label>
              <input
                type="text"
                value={config.ticketData?.nit || ''}
                onChange={(e) => onTicketDataUpdate('nit', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="123456789-0"
              />
            </div>
          </div>

          {/* Columna 2: Información de contacto */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                📞 Teléfono
              </label>
              <input
                type="text"
                value={config.ticketData?.phone || ''}
                onChange={(e) => onTicketDataUpdate('phone', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="(601) 123-4567"
              />
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                📍 Dirección
              </label>
              <input
                type="text"
                value={config.ticketData?.address || ''}
                onChange={(e) => onTicketDataUpdate('address', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Calle 123 #45-67"
              />
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                ✉️ Email
              </label>
              <input
                type="email"
                value={config.ticketData?.email || ''}
                onChange={(e) => onTicketDataUpdate('email', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="contacto@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* Mensajes del ticket - Ancho completo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              🌐 Sitio Web
            </label>
            <input
              type="text"
              value={config.ticketData?.website || ''}
              onChange={(e) => onTicketDataUpdate('website', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="www.empresa.com"
            />
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              ℹ️ Información Adicional
            </label>
            <input
              type="text"
              value={config.ticketData?.footerInfo || ''}
              onChange={(e) => onTicketDataUpdate('footerInfo', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Horario: 24/7"
            />
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              💬 Mensaje Final
            </label>
            <textarea
              value={config.ticketData?.footerMessage || ''}
              onChange={(e) => onTicketDataUpdate('footerMessage', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
              rows={2}
              placeholder="¡Gracias por confiar en nosotros!"
            />
          </div>
        </div>
      </div>

    </div>
  );
}