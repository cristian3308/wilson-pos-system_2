'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Scan, 
  Printer, 
  QrCode,
  Clock,
  DollarSign,
  Calendar,
  User,
  Ticket as TicketIcon,
  Camera,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import CompanyLogo from './ui/CompanyLogo';
import { Html5QrcodeScanner } from 'html5-qrcode';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { useHydration } from '@/hooks/useHydration';

interface TicketData {
  id: string;
  barcode: string;
  placa: string;
  vehicleType: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  tiempoTotal?: string;
  valorPagar?: number;
  estado: 'activo' | 'pagado';
}

interface VehicleType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  tarifa: number; // precio por hora
}

const vehicleTypes: VehicleType[] = [
  { id: 'carro', name: 'Carro', icon: Car, tarifa: 2000 },
  { id: 'moto', name: 'Moto', icon: Car, tarifa: 1500 },
  { id: 'bicicleta', name: 'Bicicleta', icon: Car, tarifa: 1000 }
];

export default function TicketSystem() {
  const isHydrated = useHydration();
  const [currentTime, setCurrentTime] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>(vehicleTypes[0]);
  const [placa, setPlaca] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [activeTickets, setActiveTickets] = useState<TicketData[]>([]);
  const [scannedTicket, setScannedTicket] = useState<TicketData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isHydrated) {
      const updateTime = () => {
        setCurrentTime(new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }));
      };
      
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isHydrated]);

  // Generar código de barras único
  const generateBarcode = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `WCW${timestamp}${random}`;
  };

  // Calcular tiempo transcurrido
  const calculateTime = (entrada: Date, salida: Date = new Date()) => {
    const diffMs = salida.getTime() - entrada.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}H${minutes.toString().padStart(2, '0')}M`;
  };

  // Calcular valor a pagar
  const calculateAmount = (entrada: Date, tarifa: number, salida: Date = new Date()) => {
    const diffMs = salida.getTime() - entrada.getTime();
    const hours = Math.ceil(diffMs / (1000 * 60 * 60)); // Redondear hacia arriba
    return Math.max(hours * tarifa, tarifa); // Mínimo una hora
  };

  // Generar ticket de entrada
  const generateEntryTicket = () => {
    if (!placa.trim()) {
      alert('Por favor ingrese una placa válida');
      return;
    }

    const barcode = generateBarcode();
    const newTicket: TicketData = {
      id: barcode,
      barcode,
      placa: placa.toUpperCase(),
      vehicleType: selectedVehicleType.name,
      fechaEntrada: new Date(),
      estado: 'activo'
    };

    setActiveTickets(prev => [...prev, newTicket]);
    printEntryTicket(newTicket);
    setPlaca('');
  };

  // Imprimir ticket de entrada
  const printEntryTicket = (ticket: TicketData) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 120] // Formato de ticket pequeño
    });

    // Header con logo
    doc.setFontSize(12);
    doc.text('WILSON CARS & WASH', 40, 15, { align: 'center' });
    doc.setFontSize(8);
    doc.text('PARKING PROFESSIONAL', 40, 20, { align: 'center' });
    
    // Línea separadora
    doc.line(5, 25, 75, 25);
    
    // Información del ticket
    doc.setFontSize(10);
    doc.text('TICKET DE ENTRADA', 40, 35, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Placa: ${ticket.placa}`, 10, 45);
    doc.text(`Vehículo: ${ticket.vehicleType}`, 10, 50);
    doc.text(`Fecha: ${ticket.fechaEntrada.toLocaleDateString('es-CO')}`, 10, 55);
    doc.text(`Hora: ${ticket.fechaEntrada.toLocaleTimeString('es-CO')}`, 10, 60);
    
    // Código de barras
    doc.text(`Código: ${ticket.barcode}`, 10, 70);
    
    // Generar código de barras visual
    if (canvasRef.current) {
      JsBarcode(canvasRef.current, ticket.barcode, {
        format: "CODE128",
        width: 1,
        height: 40,
        displayValue: false
      });
      
      const barcodeDataUrl = canvasRef.current.toDataURL();
      doc.addImage(barcodeDataUrl, 'PNG', 10, 75, 60, 15);
    }
    
    // Footer
    doc.setFontSize(6);
    doc.text('Conserve este ticket para el pago', 40, 100, { align: 'center' });
    doc.text('Tarifa por hora: $' + selectedVehicleType.tarifa.toLocaleString(), 40, 105, { align: 'center' });
    
    // Abrir en nueva ventana para imprimir
    window.open(doc.output('bloburl'), '_blank');
  };

  // Procesar salida del vehículo
  const processExit = (ticket: TicketData) => {
    const fechaSalida = new Date();
    const tiempoTotal = calculateTime(ticket.fechaEntrada, fechaSalida);
    const vehicleTypeData = vehicleTypes.find(v => v.name === ticket.vehicleType);
    const valorPagar = calculateAmount(ticket.fechaEntrada, vehicleTypeData?.tarifa || 2000, fechaSalida);

    const updatedTicket = {
      ...ticket,
      fechaSalida,
      tiempoTotal,
      valorPagar,
      estado: 'pagado' as const
    };

    setScannedTicket(updatedTicket);
    setShowPayment(true);
  };

  // Imprimir factura
  const printInvoice = (ticket: TicketData) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150]
    });

    // Header
    doc.setFontSize(12);
    doc.text('WILSON CARS & WASH', 40, 15, { align: 'center' });
    doc.setFontSize(8);
    doc.text('PARKING PROFESSIONAL', 40, 20, { align: 'center' });
    doc.text('NIT: 19475534', 40, 25, { align: 'center' });
    
    doc.line(5, 30, 75, 30);
    
    // Información de factura
    doc.setFontSize(10);
    doc.text('FACTURA DE PARQUEADERO', 40, 40, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Placa: ${ticket.placa}`, 10, 50);
    doc.text(`Vehículo: ${ticket.vehicleType}`, 10, 55);
    
    doc.text(`Entrada: ${ticket.fechaEntrada.toLocaleDateString('es-CO')}`, 10, 65);
    doc.text(`Hora: ${ticket.fechaEntrada.toLocaleTimeString('es-CO')}`, 10, 70);
    
    doc.text(`Salida: ${ticket.fechaSalida?.toLocaleDateString('es-CO')}`, 10, 80);
    doc.text(`Hora: ${ticket.fechaSalida?.toLocaleTimeString('es-CO')}`, 10, 85);
    
    doc.text(`Tiempo Total: ${ticket.tiempoTotal}`, 10, 95);
    
    doc.line(5, 100, 75, 100);
    
    // Total a pagar
    doc.setFontSize(10);
    doc.text(`TOTAL A PAGAR: $${ticket.valorPagar?.toLocaleString()}`, 40, 110, { align: 'center' });
    
    doc.setFontSize(6);
    doc.text('Gracias por su visita', 40, 125, { align: 'center' });
    doc.text(`Código: ${ticket.barcode}`, 40, 130, { align: 'center' });

    // Actualizar ticket y remover de activos
    setActiveTickets(prev => prev.filter(t => t.id !== ticket.id));
    setShowPayment(false);
    setScannedTicket(null);
    
    window.open(doc.output('bloburl'), '_blank');
  };

  // Inicializar escáner
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "barcode-scanner",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          const ticket = activeTickets.find(t => t.barcode === decodedText);
          if (ticket) {
            processExit(ticket);
            scanner.clear();
            setShowScanner(false);
          } else {
            alert('Ticket no encontrado o ya procesado');
          }
        },
        (error) => {
          console.warn(`Error de escaneo: ${error}`);
        }
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [showScanner, activeTickets]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="mb-4">
        <div className="bg-white rounded-xl p-3 shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CompanyLogo size="sm" showText={true} className="text-gray-800" />
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">PARQUEADERO WILSON</h1>
                <p className="text-gray-600 text-xs">NIT 19475534</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <span className="text-xs font-medium">Bienvenido Wilson González</span>
              </div>
              <div className="text-sm font-mono font-bold text-gray-800">{currentTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowScanner(!showScanner)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Scan className="w-5 h-5" />
          {showScanner ? 'Cerrar Escáner' : 'Escanear Salida'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Registro de Entrada */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TicketIcon className="w-5 h-5" />
            Registro de Entrada
          </h2>
          
          {/* Selección de vehículo */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">Tipo de Vehículo</label>
            <div className="grid grid-cols-3 gap-3">
              {vehicleTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedVehicleType(type)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedVehicleType.id === type.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <type.icon className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium block">{type.name}</span>
                  <span className="text-xs opacity-70">${type.tarifa}/hr</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Entrada de placa */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">Placa del Vehículo</label>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              className="w-full p-4 border-2 border-yellow-400 rounded-xl bg-yellow-50 text-gray-800 text-center text-xl font-bold uppercase"
              maxLength={10}
            />
          </div>

          {/* Botón generar ticket */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateEntryTicket}
            disabled={!placa.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Generar Ticket de Entrada
          </motion.button>
        </div>

        {/* Escáner de Códigos */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Escáner de Salida
          </h2>
          
          {showScanner ? (
            <div>
              <div id="barcode-scanner" className="w-full"></div>
              <p className="text-center text-gray-600 mt-4">
                Enfoque el código de barras del ticket en la cámara
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Haga clic en "Escanear Salida" para activar la cámara
              </p>
              <p className="text-sm text-gray-500">
                Escanee el código de barras del ticket para procesar la salida
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tickets Activos */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Vehículos en Parqueadero ({activeTickets.length})
        </h2>
        
        {activeTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay vehículos en el parqueadero
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg">{ticket.placa}</span>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                    Activo
                  </span>
                </div>
                <p className="text-gray-600 mb-1">{ticket.vehicleType}</p>
                <p className="text-sm text-gray-500">
                  Entrada: {ticket.fechaEntrada.toLocaleString('es-CO')}
                </p>
                <p className="text-sm text-gray-500">
                  Tiempo: {calculateTime(ticket.fechaEntrada)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Código: {ticket.barcode}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Pago */}
      {showPayment && scannedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Facturación</h3>
              <button
                onClick={() => {
                  setShowPayment(false);
                  setScannedTicket(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Placa:</span>
                <span className="font-bold">{scannedTicket.placa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehículo:</span>
                <span>{scannedTicket.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo Total:</span>
                <span className="font-mono">{scannedTicket.tiempoTotal}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-green-600">
                    ${scannedTicket.valorPagar?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => printInvoice(scannedTicket)}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Imprimir Factura y Cobrar
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
}