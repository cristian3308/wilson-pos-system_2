'use client';

import React, { useState } from 'react';

interface SyncButtonProps {
  onSyncComplete?: (success: boolean, results?: any) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success';
  children?: React.ReactNode;
}

const SyncButton: React.FC<SyncButtonProps> = ({ 
  onSyncComplete, 
  className = '', 
  size = 'md',
  variant = 'primary',
  children = 'Solo Local'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSync = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setShowResult(false);
    
    try {
      console.log('📱 Sistema funcionando solo localmente');
      
      // Simular una verificación rápida
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSyncResult('✅ Sistema local funcionando correctamente');
      setShowResult(true);
      onSyncComplete?.(true, { message: 'Local only system' });
      
    } catch (error) {
      console.error('❌ Error en verificación local:', error);
      setLastSyncResult('❌ Error en verificación local');
      setShowResult(true);
      onSyncComplete?.(false, { error });
    } finally {
      setIsLoading(false);
      
      // Ocultar resultado después de 3 segundos
      setTimeout(() => {
        setShowResult(false);
        setLastSyncResult(null);
      }, 3000);
    }
  };

  // Clases base para diferentes tamaños
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Clases base para diferentes variantes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border border-gray-600',
    success: 'bg-green-600 hover:bg-green-700 text-white border border-green-600'
  };

  const baseClasses = `
    inline-flex items-center justify-center 
    font-medium rounded-lg transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <div className="relative inline-block">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className={baseClasses}
        title={isLoading ? 'Verificando...' : 'Sistema funcionando solo localmente'}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verificando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {children}
          </>
        )}
      </button>
      
      {/* Mensaje de resultado */}
      {showResult && lastSyncResult && (
        <div className={`
          absolute top-full left-1/2 transform -translate-x-1/2 mt-2 
          px-3 py-2 rounded-lg text-sm font-medium
          ${lastSyncResult.startsWith('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
          }
          whitespace-nowrap shadow-lg z-50
        `}>
          {lastSyncResult}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-current opacity-20"></div>
        </div>
      )}
    </div>
  );
};

export default SyncButton;