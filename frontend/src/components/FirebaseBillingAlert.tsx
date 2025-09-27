'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CreditCard, ExternalLink, X } from 'lucide-react';

interface FirebaseBillingAlertProps {
  onDismiss?: () => void;
}

const FirebaseBillingAlert: React.FC<FirebaseBillingAlertProps> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si hay errores de facturación en console
    const checkForBillingErrors = () => {
      // Escuchar errores de la consola
      const originalError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('FIREBASE BILLING ERROR') || message.includes('billing to be enabled')) {
          setIsVisible(true);
        }
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    };

    const cleanup = checkForBillingErrors();
    return cleanup;
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const openFirebaseConsole = () => {
    window.open('https://console.firebase.google.com/project/parquelavadero-c5a88/settings/usage', '_blank');
  };

  const openBillingHelp = () => {
    window.open('https://console.developers.google.com/billing/enable?project=parquelavadero-c5a88', '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md z-50">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Firebase: Facturación Requerida
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p className="mb-2">
                Para usar Firebase Firestore necesitas habilitar facturación en tu proyecto.
              </p>
              <p className="text-xs text-red-600 mb-3">
                ⚠️ <strong>La aplicación está funcionando solo en modo offline</strong>
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={openBillingHelp}
                  className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                  <CreditCard size={16} />
                  Habilitar Facturación
                  <ExternalLink size={14} />
                </button>
                
                <button
                  onClick={openFirebaseConsole}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded text-xs transition-colors"
                >
                  Abrir Firebase Console
                  <ExternalLink size={12} />
                </button>
              </div>

              <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded">
                <strong>📋 Pasos:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Haz clic en "Habilitar Facturación"</li>
                  <li>Selecciona plan "Blaze (Pay as you go)"</li>
                  <li>Agrega tarjeta de crédito</li>
                  <li>Espera 5-10 minutos</li>
                  <li>Recarga la página</li>
                </ol>
                <p className="mt-2 font-medium">
                  💰 Costo típico: $0-5/mes para proyectos pequeños
                </p>
              </div>
            </div>
          </div>
          <div className="ml-4">
            <button
              onClick={handleDismiss}
              className="inline-flex text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseBillingAlert;