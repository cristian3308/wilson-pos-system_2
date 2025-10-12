'use client';

import React, { useState, useEffect } from 'react';
import { Car, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VehicleType {
  id: number;
  name: string;
  pricePerHour: number;
  icon: string;
}

export default function ParkingPriceConfig() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedPrice, setEditedPrice] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', price: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  const loadVehicleTypes = async () => {
    try {
      const response = await fetch('/api/v1/configuracion/vehicle-types');
      if (response.ok) {
        const data = await response.json();
        setVehicleTypes(data);
      }
    } catch (error) {
      console.error('Error loading vehicle types:', error);
    }
  };

  const handleEdit = (vehicle: VehicleType) => {
    setEditingId(vehicle.id);
    setEditedPrice(vehicle.pricePerHour.toString());
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedPrice('');
  };

  const handleSave = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/configuracion/vehicle-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerHour: parseFloat(editedPrice) }),
      });

      if (response.ok) {
        toast.success('Precio actualizado correctamente');
        await loadVehicleTypes();
        setEditingId(null);
        setEditedPrice('');
      } else {
        toast.error('Error al actualizar precio');
      }
    } catch (error) {
      toast.error('Error al guardar cambios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!newVehicle.name || !newVehicle.price) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/configuracion/vehicle-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVehicle.name,
          pricePerHour: parseFloat(newVehicle.price),
        }),
      });

      if (response.ok) {
        toast.success('Tipo de vehículo agregado correctamente');
        await loadVehicleTypes();
        setIsAddingNew(false);
        setNewVehicle({ name: '', price: '' });
      } else {
        toast.error('Error al agregar tipo de vehículo');
      }
    } catch (error) {
      toast.error('Error al guardar');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este tipo de vehículo?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/configuracion/vehicle-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Tipo de vehículo eliminado');
        await loadVehicleTypes();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Car className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Configuración de Precios - Parqueadero
            </h3>
            <p className="text-sm text-gray-500">
              Gestiona los precios por tipo de vehículo
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Tipo
        </button>
      </div>

      {/* Tabla de precios */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Tipo de Vehículo
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Precio/Hora
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {vehicleTypes.map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{vehicle.icon || '🚗'}</span>
                    <span className="font-medium text-gray-800">{vehicle.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  {editingId === vehicle.id ? (
                    <input
                      type="number"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(e.target.value)}
                      className="w-32 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      placeholder="Precio"
                      autoFocus
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(vehicle.pricePerHour)}
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === vehicle.id ? (
                      <>
                        <button
                          onClick={() => handleSave(vehicle.id)}
                          disabled={loading}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          title="Guardar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={loading}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={loading}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {/* Fila para agregar nuevo */}
            {isAddingNew && (
              <tr className="border-b border-gray-100 bg-blue-50">
                <td className="py-4 px-4">
                  <input
                    type="text"
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del vehículo"
                  />
                </td>
                <td className="py-4 px-4 text-right">
                  <input
                    type="number"
                    value={newVehicle.price}
                    onChange={(e) => setNewVehicle({ ...newVehicle, price: e.target.value })}
                    className="w-32 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                    placeholder="Precio"
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleAddNew}
                      disabled={loading}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                      title="Guardar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewVehicle({ name: '', price: '' });
                      }}
                      disabled={loading}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {vehicleTypes.length === 0 && !isAddingNew && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay tipos de vehículos configurados</p>
          <p className="text-sm text-gray-400 mt-2">
            Haz clic en "Agregar Tipo" para comenzar
          </p>
        </div>
      )}
    </div>
  );
}
