'use client';

import { useState, useEffect } from 'react';
import { getDualDB } from '@/lib/dualDatabase';

interface LocalStatus {
  isAvailable: boolean;
  recordCount: number;
}

interface DatabaseStatusProps {
  className?: string;
}

export default function DatabaseStatus({ className = '' }: DatabaseStatusProps) {
  const [status, setStatus] = useState<LocalStatus>({
    isAvailable: false,
    recordCount: 0
  });

  useEffect(() => {
    const updateStatus = async () => {
      const dualDB = getDualDB();
      
      const isAvailable = typeof window !== 'undefined' && !!window.indexedDB;
      let recordCount = 0;
      
      if (isAvailable) {
        try {
          const tickets = await dualDB.getParkingTickets();
          const workers = await dualDB.getAllWorkers();
          const services = await dualDB.getAllCarwashServices();
          recordCount = tickets.length + workers.length + services.length;
        } catch (error) {
          console.warn('Error counting records:', error);
        }
      }
      
      setStatus({
        isAvailable,
        recordCount
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, []);
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <h3 className="font-medium text-gray-900">
              {status.isAvailable ? 'Almacenamiento Local' : 'Error de Almacenamiento'}
            </h3>
            <p className="text-sm text-gray-600">
              {status.isAvailable 
                ? 'Los datos se guardan en tu navegador' 
                : 'No se puede acceder al almacenamiento local'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            📱
          </div>
          <div className="text-xs text-gray-600">
            Local Only
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {status.recordCount}
          </div>
          <div className="text-xs text-gray-600">
            Registros
          </div>
        </div>
      </div>
    </div>
  );
}