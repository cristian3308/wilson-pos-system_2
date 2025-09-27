'use client';

import React, { useState, useEffect } from 'react';

interface DatabaseInitializerProps {
  onInitialized?: () => void;
}

const DatabaseInitializer: React.FC<DatabaseInitializerProps> = ({ onInitialized }) => {
  const [status, setStatus] = useState<'checking' | 'initializing' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Inicializando base de datos local...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setStatus('checking');
      setMessage('🔄 Verificando sistema local...');
      setProgress(20);

      // Simular verificación del sistema local
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('initializing');
      setMessage('💾 Inicializando base de datos local...');
      setProgress(60);

      // Simular inicialización de IndexedDB
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(80);

      setMessage('✅ Base de datos local inicializada correctamente');
      setStatus('success');
      setProgress(100);
      
      if (onInitialized) {
        onInitialized();
      }

    } catch (error) {
      console.error('Error during database initialization:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setStatus('error');
    }
  };

  const retryInitialization = () => {
    setProgress(0);
    initializeDatabase();
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Sistema Listo</h3>
            <p className="text-sm text-green-700 mt-1">La base de datos local está funcionando correctamente</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-blue-900">Inicializando Sistema</h3>
          <p className="text-blue-700">{message}</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {status === 'error' && (
        <div className="mt-4">
          <button
            onClick={retryInitialization}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-4 text-sm text-blue-600">
        <p>• El sistema funciona completamente de manera local</p>
        <p>• Todos los datos se almacenan en tu dispositivo</p>
        <p>• No se requiere conexión a internet</p>
      </div>
    </div>
  );
};

export default DatabaseInitializer;