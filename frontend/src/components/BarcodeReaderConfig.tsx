import React, { useState, useEffect } from 'react';
import { barcodeReaderService } from '../services/BarcodeReaderService';

interface BarcodeReaderConfigProps {
  onBarcodeScanned?: (barcode: string) => void;
  showTestArea?: boolean;
}

const BarcodeReaderConfig: React.FC<BarcodeReaderConfigProps> = ({ 
  onBarcodeScanned, 
  showTestArea = true 
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState<{
    isConnected: boolean;
    isReading: boolean;
    portInfo?: SerialPortInfo;
  }>({ isConnected: false, isReading: false });
  
  const [availableDevices, setAvailableDevices] = useState<{
    found: boolean;
    devices: { port: SerialPort; info: SerialPortInfo | undefined; score: number }[];
    message: string;
  }>({ found: false, devices: [], message: '' });
  
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const [scannedCodes, setScannedCodes] = useState<{ code: string; timestamp: Date }[]>([]);

  useEffect(() => {
    // Verificar soporte y obtener estado inicial
    setIsSupported(barcodeReaderService.isSupported());
    updateStatus();

    // Configurar callbacks SOLO si onBarcodeScanned está definido
    // Si es undefined, significa que otro componente ya manejó el callback
    if (onBarcodeScanned) {
      barcodeReaderService.onBarcode((barcode: string) => {
        setLastScannedBarcode(barcode);
        setScannedCodes(prev => [{
          code: barcode,
          timestamp: new Date()
        }, ...prev.slice(0, 9)]); // Mantener solo los últimos 10
        
        onBarcodeScanned(barcode);
      });
    }

    barcodeReaderService.onConnection(() => {
      updateStatus();
      setConnectionMessage('✅ Lector conectado exitosamente');
    });

    barcodeReaderService.onDisconnection(() => {
      updateStatus();
      setConnectionMessage('⚠️ Lector desconectado');
    });

    // Detectar dispositivos al cargar
    detectDevices();
  }, [onBarcodeScanned]);

  const updateStatus = () => {
    const currentStatus = barcodeReaderService.getStatus();
    setStatus({
      isConnected: currentStatus.isConnected,
      isReading: currentStatus.isReading,
      portInfo: currentStatus.portInfo
    });
  };

  const detectDevices = async () => {
    if (!isSupported) return;
    
    setIsDetecting(true);
    try {
      const detection = await barcodeReaderService.detectBarcodeReaders();
      setAvailableDevices(detection);
    } catch (error) {
      console.error('Error detectando dispositivos:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const requestNewDevice = async () => {
    setIsConnecting(true);
    try {
      const result = await barcodeReaderService.requestBarcodeReader();
      if (result.success && result.port) {
        const connectResult = await barcodeReaderService.connect(result.port);
        setConnectionMessage(connectResult.message);
        
        if (connectResult.success) {
          await detectDevices(); // Actualizar lista
        }
      } else {
        setConnectionMessage(result.message);
      }
    } catch (error) {
      setConnectionMessage('Error al conectar dispositivo');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectToDevice = async (port: SerialPort) => {
    setIsConnecting(true);
    try {
      const result = await barcodeReaderService.connect(port);
      setConnectionMessage(result.message);
    } catch (error) {
      setConnectionMessage('Error al conectar');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = async () => {
    try {
      await barcodeReaderService.disconnect();
      setConnectionMessage('Lector desconectado');
    } catch (error) {
      setConnectionMessage('Error al desconectar');
    }
  };

  const testReader = async () => {
    const result = await barcodeReaderService.testReader();
    setConnectionMessage(result.message);
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-lg border shadow-lg p-6 max-w-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📊 Configuración de Lector de Código de Barras
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
              No Compatible
            </span>
          </h3>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">
            Tu navegador no soporta la Web Serial API. Usa Chrome, Edge o un navegador compatible para conectar lectores de código de barras USB.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border shadow-lg p-6 max-w-2xl">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📊 Configuración de Lector de Código de Barras
            {status.isConnected ? (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Conectado
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                Desconectado
              </span>
            )}
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Detecta y configura lectores de código de barras USB para entrada y salida automática de vehículos
          </p>
        </div>

        <div className="space-y-4">
          {/* Estado actual */}
          {status.isConnected && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">✅ Lector Conectado</p>
                  <p className="text-sm text-green-600">
                    {status.isReading ? '🔄 Leyendo códigos...' : '⏸️ En espera'}
                  </p>
                  {status.portInfo && (
                    <p className="text-xs text-green-500 mt-1">
                      Vendor: {status.portInfo.usbVendorId?.toString(16)} | 
                      Product: {status.portInfo.usbProductId?.toString(16)}
                    </p>
                  )}
                </div>
                <div className="space-x-2">
                  <button 
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    onClick={testReader}
                  >
                    🧪 Probar
                  </button>
                  <button 
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={disconnectDevice}
                  >
                    🔌 Desconectar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dispositivos detectados automáticamente */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Dispositivos Detectados</h4>
              <button 
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                onClick={detectDevices}
                disabled={isDetecting}
              >
                {isDetecting ? '🔄 Detectando...' : '🔍 Detectar'}
              </button>
            </div>

            {availableDevices.found ? (
              <div className="space-y-2">
                {availableDevices.devices.map((device, index) => (
                  <div key={index} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        📊 Lector #{index + 1}
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Score: {device.score}
                        </span>
                      </p>
                      {device.info && (
                        <p className="text-sm text-gray-600">
                          Vendor ID: {device.info.usbVendorId?.toString(16).toUpperCase()} | 
                          Product ID: {device.info.usbProductId?.toString(16).toUpperCase()}
                        </p>
                      )}
                    </div>
                    <button
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      onClick={() => connectToDevice(device.port)}
                      disabled={isConnecting || status.isConnected}
                    >
                      {isConnecting ? '🔄 Conectando...' : '🔗 Conectar'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-700">{availableDevices.message}</p>
              </div>
            )}
          </div>

          <hr className="my-4" />

          {/* Conectar dispositivo manualmente */}
          <div>
            <h4 className="font-medium mb-2">Conectar Manualmente</h4>
            <button 
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              onClick={requestNewDevice}
              disabled={isConnecting || status.isConnected}
            >
              {isConnecting ? '🔄 Conectando...' : '📱 Seleccionar Lector de Código de Barras'}
            </button>
          </div>

          {/* Mensajes de estado */}
          {connectionMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-700">{connectionMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Área de pruebas */}
      {showTestArea && (
        <div className="bg-white rounded-lg border shadow-lg p-6 max-w-2xl">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">🧪 Área de Pruebas</h3>
            <p className="text-gray-600 text-sm">
              Prueba el lector escaneando códigos de barras
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Último código escaneado */}
            {lastScannedBarcode && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800">📊 Último Código Escaneado:</p>
                <p className="text-lg font-mono text-blue-900 mt-1">{lastScannedBarcode}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Date().toLocaleString('es-CO')}
                </p>
              </div>
            )}

            {/* Historial de códigos */}
            {scannedCodes.length > 0 && (
              <div>
                <h5 className="font-medium mb-2">📋 Historial Reciente</h5>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {scannedCodes.map((scan, index) => (
                    <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                      <span className="font-mono">{scan.code}</span>
                      <span className="text-gray-500">
                        {scan.timestamp.toLocaleTimeString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instrucciones */}
            {status.isConnected && scannedCodes.length === 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700">🎯 Escanea un código de barras para probar la conexión</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeReaderConfig;