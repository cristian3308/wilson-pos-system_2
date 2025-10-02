'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Car, 
  Truck, 
  Bike,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface VehicleType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  tarifa: number;
}

interface AddVehicleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (vehicleType: VehicleType) => void;
  existingTypes: VehicleType[];
}

// Iconos disponibles para los tipos de vehículos
const availableIcons = [
  { name: 'Car', icon: Car, label: '🚗 Carro' },
  { name: 'Truck', icon: Truck, label: '🚛 Camión' },
  { name: 'Bike', icon: Bike, label: '🚴 Bicicleta' },
];

export default function AddVehicleTypeModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  existingTypes 
}: AddVehicleTypeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    tarifa: 0,
    selectedIcon: 'Car'
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (existingTypes.some(type => 
      type.name.toLowerCase() === formData.name.trim().toLowerCase()
    )) {
      newErrors.name = 'Ya existe un tipo de vehículo con este nombre';
    }

    // Validar tarifa
    if (!formData.tarifa || formData.tarifa <= 0) {
      newErrors.tarifa = 'La tarifa debe ser mayor a 0';
    } else if (formData.tarifa < 500) {
      newErrors.tarifa = 'La tarifa mínima es $500';
    } else if (formData.tarifa > 50000) {
      newErrors.tarifa = 'La tarifa máxima es $50,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Crear el nuevo tipo de vehículo
      const newVehicleType: VehicleType = {
        id: `custom_${Date.now()}`, // ID único basado en timestamp
        name: formData.name.trim(),
        icon: availableIcons.find(icon => icon.name === formData.selectedIcon)?.icon || Car,
        tarifa: formData.tarifa
      };

      // Llamar a la función onAdd
      onAdd(newVehicleType);

      // Limpiar formulario y cerrar modal
      setFormData({ name: '', tarifa: 0, selectedIcon: 'Car' });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error agregando tipo de vehículo:', error);
      setErrors({ submit: 'Error al agregar el tipo de vehículo' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', tarifa: 0, selectedIcon: 'Car' });
      setErrors({});
      onClose();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Agregar Tipo de Vehículo</h2>
                    <p className="text-blue-100 text-sm">Crear un nuevo tipo personalizado</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-white hover:text-blue-200 transition-colors p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nombre del vehículo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Vehículo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500 bg-gray-50'
                  }`}
                  placeholder="Ej: Bicicleta, Volqueta, Moto de alto cilindraje..."
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Icono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icono Representativo
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {availableIcons.map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedIcon: iconOption.name })}
                        disabled={isSubmitting}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          formData.selectedIcon === iconOption.name
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs font-medium">{iconOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tarifa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tarifa por Hora
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    min="500"
                    max="50000"
                    step="500"
                    value={formData.tarifa || ''}
                    onChange={(e) => setFormData({ ...formData, tarifa: parseInt(e.target.value) || 0 })}
                    className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-all ${
                      errors.tarifa 
                        ? 'border-red-300 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:border-blue-500 bg-gray-50'
                    }`}
                    placeholder="2000"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.tarifa && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.tarifa}</span>
                  </div>
                )}
                {formData.tarifa > 0 && !errors.tarifa && (
                  <div className="flex items-center space-x-2 mt-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Tarifa: {formatCurrency(formData.tarifa)} por hora
                    </span>
                  </div>
                )}
              </div>

              {/* Error de envío */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.submit}</span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Agregando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Agregar Tipo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}