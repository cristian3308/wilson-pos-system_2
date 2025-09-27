'use client';

import React, { useState, useEffect } from 'react';
import { 
  WifiIcon, 
  NoSymbolIcon, 
  CloudIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface ConnectionStatus {
  isOnline: boolean;
  localStorageAvailable: boolean;
}

export default function ConnectionIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: false,
    localStorageAvailable: false
  });

  useEffect(() => {
    checkConnection();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      // Verificar conexión a internet
      const isOnline = navigator.onLine;
      
      // Verificar disponibilidad de localStorage/IndexedDB
      let localStorageAvailable = false;
      try {
        if (typeof window !== 'undefined' && window.indexedDB) {
          localStorageAvailable = true;
        }
      } catch (error) {
        localStorageAvailable = false;
      }

      setStatus({
        isOnline,
        localStorageAvailable
      });
    } catch (error) {
      console.warn('Error checking connection:', error);
    }
  };

  const getStatusColor = () => {
    if (status.localStorageAvailable) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (status.localStorageAvailable) {
      return <CloudIcon className={`w-4 h-4 ${getStatusColor()}`} />;
    } else {
      return <NoSymbolIcon className={`w-4 h-4 ${getStatusColor()}`} />;
    }
  };

  const getStatusText = () => {
    if (status.localStorageAvailable) return 'Almacenamiento Local';
    return 'Error: Sin almacenamiento';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100">
      {getStatusIcon()}
      <span className={`text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}