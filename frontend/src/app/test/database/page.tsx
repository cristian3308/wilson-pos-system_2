'use client';

import React, { useState, useEffect } from 'react';
import DatabaseInitializer from '../../../components/DatabaseInitializer';
import { dualDatabase } from '../../../lib/dualDatabase';

const DatabaseTestPage: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setMessage('Cargando datos...');
      
      // Cargar trabajadores
      const workersList = await dualDatabase.getAllWorkers();
      setWorkers(workersList || []);

      // Cargar servicios
      const servicesList = await dualDatabase.getAllCarwashServices();
      setServices(servicesList || []);

      // Cargar tickets
      const ticketsList = await dualDatabase.getParkingTickets();
      setTickets(ticketsList || []);

      setMessage(`Datos cargados: ${workersList?.length || 0} trabajadores, ${servicesList?.length || 0} servicios, ${ticketsList?.length || 0} tickets`);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const testAddWorker = async () => {
    setLoading(true);
    try {
      const newWorker = {
        id: `worker_${Date.now()}`,
        name: `Trabajador Test ${Math.floor(Math.random() * 1000)}`,
        phone: `300${Math.floor(Math.random() * 1000000)}`,
        email: 'test@email.com',
        percentage: 60,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await dualDatabase.saveWorker(newWorker);
      await loadData(); // Recargar datos
      setMessage('Trabajador agregado correctamente');
    } catch (error) {
      setMessage(`Error agregando trabajador: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAddTicket = async () => {
    setLoading(true);
    try {
      const newTicket = {
        id: `ticket_${Date.now()}`,
        vehicleId: `vehicle_${Date.now()}`,
        placa: `TST${Math.floor(Math.random() * 1000)}`,
        vehicleType: 'car' as const,
        entryTime: new Date(),
        basePrice: 3000,
        status: 'active' as const,
        isPaid: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await dualDatabase.saveParkingTicket(newTicket);
      await loadData(); // Recargar datos
      setMessage('Ticket agregado correctamente');
    } catch (error) {
      setMessage(`Error agregando ticket: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todos los datos?')) {
      return;
    }

    setLoading(true);
    try {
      await dualDatabase.clearAllData();
      await loadData();
      setMessage('Todos los datos han sido eliminados');
    } catch (error) {
      setMessage(`Error eliminando datos: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <DatabaseInitializer onInitialized={loadData} />
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Base de Datos Local - Página de Pruebas
        </h1>

        {/* Estado y controles */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Recargar Datos'}
            </button>
            
            <button
              onClick={testAddWorker}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Agregar Trabajador Test
            </button>
            
            <button
              onClick={testAddTicket}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              Agregar Ticket Test
            </button>
            
            <button
              onClick={clearAllData}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Limpiar Todo
            </button>
          </div>

          {message && (
            <div className="p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-700">
              {message}
            </div>
          )}
        </div>

        {/* Resumen de datos */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Trabajadores</h3>
            <p className="text-2xl font-bold text-blue-600">{workers.length}</p>
            <div className="mt-2 text-sm text-blue-600">
              {workers.map(w => (
                <div key={w.id}>{w.name} ({w.percentage}%)</div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2">Servicios</h3>
            <p className="text-2xl font-bold text-green-600">{services.length}</p>
            <div className="mt-2 text-sm text-green-600">
              {services.map(s => (
                <div key={s.id}>{s.serviceName} - ${s.basePrice}</div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">Tickets</h3>
            <p className="text-2xl font-bold text-yellow-600">{tickets.length}</p>
            <div className="mt-2 text-sm text-yellow-600">
              {tickets.map(t => (
                <div key={t.id}>{t.placa} - {t.status}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Estado del Sistema</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>✅ Sistema funcionando solo localmente</li>
            <li>✅ Datos almacenados en IndexedDB del navegador</li>
            <li>✅ No requiere conexión a internet</li>
            <li>🔧 Firebase completamente eliminado</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTestPage;