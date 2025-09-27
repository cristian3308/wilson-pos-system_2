'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrashIcon, 
  ArrowPathIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { dualDatabase } from '@/lib/dualDatabase';

interface DatabaseStatus {
  localRecords: number;
  isAvailable: boolean;
}

export default function DatabaseAdmin() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    loadDatabaseStatus();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadDatabaseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDatabaseStatus = async () => {
    try {
      // Obtener estadísticas básicas de la base de datos local
      const isAvailable = typeof window !== 'undefined' && !!window.indexedDB;
      let localRecords = 0;
      
      if (isAvailable) {
        try {
          const tickets = await dualDatabase.getParkingTickets();
          const workers = await dualDatabase.getAllWorkers();
          const services = await dualDatabase.getAllCarwashServices();
          localRecords = tickets.length + workers.length + services.length;
        } catch (error) {
          console.warn('Error counting records:', error);
        }
      }
      
      setDbStatus({
        localRecords,
        isAvailable
      });
    } catch (error) {
      console.error('Error cargando estado de base de datos:', error);
    }
  };

  const clearAllData = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      await dualDatabase.clearAllData();
      setMessage({ type: 'success', text: '🗑️ Datos locales eliminados. Recargando página...' });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error}` });
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const refreshDatabase = async () => {
    setIsLoading(true);
    try {
      await loadDatabaseStatus();
      setMessage({ type: 'success', text: '✅ Estado de base de datos actualizado' });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error: ${error}` });
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageIcon = () => {
    if (!dbStatus) return <ArrowPathIcon className="w-5 h-5 animate-spin" />;
    
    if (dbStatus.isAvailable) {
      return <CircleStackIcon className="w-5 h-5 text-green-500" />;
    } else {
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const getStorageStatus = () => {
    if (!dbStatus) return 'Cargando...';
    
    if (dbStatus.isAvailable) {
      return 'Almacenamiento Local Disponible';
    } else {
      return 'Almacenamiento No Disponible';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CircleStackIcon className="w-6 h-6 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800">Administrador de Base de Datos</h3>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshDatabase}
          disabled={isLoading}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </motion.button>
      </div>

      {/* Estado de la base de datos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Estado del Almacenamiento</span>
            {getStorageIcon()}
          </div>
          <p className="text-xs text-gray-500">{getStorageStatus()}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Registros Locales</span>
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">{dbStatus?.localRecords || 0}</p>
          <p className="text-xs text-gray-500">tickets, trabajadores y servicios</p>
        </div>
      </div>

      {/* Acciones peligrosas */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
          Acciones Peligrosas
        </h4>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="font-medium text-red-800 mb-1">Limpiar Todos los Datos</h5>
              <p className="text-sm text-red-600 mb-3">
                Esta acción eliminará TODOS los datos locales permanentemente.
              </p>
            </div>
            <TrashIcon className="w-5 h-5 text-red-500 mt-1" />
          </div>

          {showConfirm ? (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllData}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Eliminando...' : '✅ Confirmar Eliminación'}
              </motion.button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 text-sm"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearAllData}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
            >
              🗑️ Limpiar Datos
            </motion.button>
          )}
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-100 text-green-700' :
            message.type === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}
    </div>
  );
}