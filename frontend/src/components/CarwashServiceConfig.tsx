'use client';

import React, { useState, useEffect } from 'react';
import { Droplet, Edit2, Save, X, Plus, Trash2, Clock, DollarSign, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

interface CarwashService {
  id: number;
  name: string;
  price: number;
  duration: number; // en minutos
  commission: number; // porcentaje
  icon: string;
}

export default function CarwashServiceConfig() {
  const [services, setServices] = useState<CarwashService[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedService, setEditedService] = useState({
    price: '',
    duration: '',
    commission: '',
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration: '',
    commission: '15',
  });
  const [loading, setLoading] = useState(false);
  const [defaultCommission, setDefaultCommission] = useState(15);

  useEffect(() => {
    loadServices();
    loadDefaultCommission();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/v1/configuracion/carwash-services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadDefaultCommission = async () => {
    try {
      const response = await fetch('/api/v1/configuracion/default-commission');
      if (response.ok) {
        const data = await response.json();
        setDefaultCommission(data.commission);
      }
    } catch (error) {
      console.error('Error loading commission:', error);
    }
  };

  const handleEdit = (service: CarwashService) => {
    setEditingId(service.id);
    setEditedService({
      price: service.price.toString(),
      duration: service.duration.toString(),
      commission: service.commission.toString(),
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedService({ price: '', duration: '', commission: '' });
  };

  const handleSave = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/configuracion/carwash-services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: parseFloat(editedService.price),
          duration: parseInt(editedService.duration),
          commission: parseFloat(editedService.commission),
        }),
      });

      if (response.ok) {
        toast.success('Servicio actualizado correctamente');
        await loadServices();
        setEditingId(null);
        setEditedService({ price: '', duration: '', commission: '' });
      } else {
        toast.error('Error al actualizar servicio');
      }
    } catch (error) {
      toast.error('Error al guardar cambios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!newService.name || !newService.price || !newService.duration) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/configuracion/carwash-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newService.name,
          price: parseFloat(newService.price),
          duration: parseInt(newService.duration),
          commission: parseFloat(newService.commission),
        }),
      });

      if (response.ok) {
        toast.success('Servicio agregado correctamente');
        await loadServices();
        setIsAddingNew(false);
        setNewService({ name: '', price: '', duration: '', commission: '15' });
      } else {
        toast.error('Error al agregar servicio');
      }
    } catch (error) {
      toast.error('Error al guardar');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este servicio?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/configuracion/carwash-services/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Servicio eliminado');
        await loadServices();
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

  const handleUpdateDefaultCommission = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/configuracion/default-commission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission: defaultCommission }),
      });

      if (response.ok) {
        toast.success('Comisión predeterminada actualizada');
      } else {
        toast.error('Error al actualizar comisión');
      }
    } catch (error) {
      toast.error('Error al guardar');
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
    <div className="space-y-6">
      {/* Configuración de Servicios */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Droplet className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Configuración de Servicios - Lavadero
              </h3>
              <p className="text-sm text-gray-500">
                Gestiona los servicios, precios y duraciones
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Servicio
          </button>
        </div>

        {/* Tabla de servicios */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Servicio
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Precio
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Duración
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                  Comisión
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{service.icon || '🧼'}</span>
                      <span className="font-medium text-gray-800">{service.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {editingId === service.id ? (
                      <input
                        type="number"
                        value={editedService.price}
                        onChange={(e) =>
                          setEditedService({ ...editedService, price: e.target.value })
                        }
                        className="w-32 px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                        placeholder="Precio"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(service.price)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {editingId === service.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editedService.duration}
                          onChange={(e) =>
                            setEditedService({ ...editedService, duration: e.target.value })
                          }
                          className="w-20 px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                          placeholder="Min"
                        />
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    ) : (
                      <span className="text-gray-700">{service.duration} min</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {editingId === service.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editedService.commission}
                          onChange={(e) =>
                            setEditedService({ ...editedService, commission: e.target.value })
                          }
                          className="w-20 px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                          placeholder="%"
                        />
                        <Percent className="w-4 h-4 text-gray-400" />
                      </div>
                    ) : (
                      <span className="text-gray-700">{service.commission}%</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === service.id ? (
                        <>
                          <button
                            onClick={() => handleSave(service.id)}
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
                            onClick={() => handleEdit(service)}
                            className="p-2 bg-cyan-100 text-cyan-600 rounded-lg hover:bg-cyan-200 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
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
                <tr className="border-b border-gray-100 bg-cyan-50">
                  <td className="py-4 px-4">
                    <input
                      type="text"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="w-full px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Nombre del servicio"
                    />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                      className="w-32 px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-right"
                      placeholder="Precio"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="number"
                      value={newService.duration}
                      onChange={(e) =>
                        setNewService({ ...newService, duration: e.target.value })
                      }
                      className="w-20 px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center mx-auto"
                      placeholder="Min"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input
                      type="number"
                      value={newService.commission}
                      onChange={(e) =>
                        setNewService({ ...newService, commission: e.target.value })
                      }
                      className="w-20 px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center mx-auto"
                      placeholder="%"
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
                          setNewService({ name: '', price: '', duration: '', commission: '15' });
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

        {services.length === 0 && !isAddingNew && (
          <div className="text-center py-12">
            <Droplet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay servicios configurados</p>
            <p className="text-sm text-gray-400 mt-2">
              Haz clic en "Agregar Servicio" para comenzar
            </p>
          </div>
        )}
      </div>

      {/* Configuración de Comisión Predeterminada */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg shadow-md p-6 border border-cyan-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Percent className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 text-lg">
                Comisión Predeterminada de Trabajadores
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Porcentaje que se aplicará automáticamente a nuevos servicios
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm">
              <input
                type="number"
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(parseFloat(e.target.value))}
                className="w-20 px-3 py-2 border border-cyan-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center font-semibold text-lg"
                placeholder="%"
                min="0"
                max="100"
              />
              <span className="text-gray-600 font-medium">%</span>
            </div>
            <button
              onClick={handleUpdateDefaultCommission}
              disabled={loading}
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:opacity-50 shadow-sm"
            >
              Guardar
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-white/50 rounded-lg p-3">
          <span className="text-cyan-600">ℹ️</span>
          <p>
            Esta comisión se aplicará automáticamente cuando calcules las ganancias de los
            trabajadores en el cierre de caja.
          </p>
        </div>
      </div>
    </div>
  );
}
