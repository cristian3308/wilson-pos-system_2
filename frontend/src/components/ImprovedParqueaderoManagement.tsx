'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, 
  Search, 
  Calendar,
  Filter,
  Download,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Scan,
  Printer,
  QrCode,
  DollarSign,
  User,
  Ticket as TicketIcon,
  Camera,
  Calculator
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import CompanyLogo from './ui/CompanyLogo';
import { useHydration } from '@/hooks/useHydration';
import { dualDatabase } from '@/lib/dualDatabase';
import { parkingSystem } from '@/lib/parkingSystem';
import { barcodeReaderService } from '../services/BarcodeReaderService';
import { getLocalDB, VehicleTypeConfig } from '@/lib/localDatabase';
import BarcodeReaderConfig from './BarcodeReaderConfig';
import SyncButton from './SyncButton';
import AddVehicleTypeModal from './AddVehicleTypeModal';
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';

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

import { printModernTicket } from './PrintFallback';
import { printThermalTicket } from './PrintFallback';

// Iconos disponibles para mapear con los tipos dinámicos
const iconMap: { [key: string]: React.ComponentType<any> } = {
  Car: Car,
  Truck: Car, // Puedes cambiar por un icono específico
  Bike: Car   // Puedes cambiar por un icono específico
};

// Tipos de vehículos predeterminados (se combinan con los dinámicos)
const defaultVehicleTypes: VehicleType[] = [
  { id: 'todos', name: 'Todos los tipos', icon: Car, tarifa: 0 }, // Para mostrar todos sin filtrar
  { id: 'carro', name: 'Carro', icon: Car, tarifa: 2000 },
  { id: 'moto', name: 'Moto', icon: Car, tarifa: 1500 },
  { id: 'camioneta', name: 'Camioneta', icon: Car, tarifa: 3000 },
  { id: 'buseta', name: 'Buseta', icon: Car, tarifa: 5000 }
];

interface VehicleRecord {
  id: number;
  vehiculo: string;
  placa: string;
  tipo: string;
  entrada: string;
  salida: string;
  tiempo: string;
  estado: 'Parqueado' | 'Salió';
  cobro: number;
  comentarios?: string;
  barcode?: string;
  ticketData?: TicketData;
}

const sampleVehicles: VehicleRecord[] = [];

export default function ImprovedParqueaderoManagement() {
  const isHydrated = useHydration();
  const [currentTime, setCurrentTime] = useState('');
  
  // Estados para tipos de vehículos dinámicos
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(defaultVehicleTypes);
  const [showAddVehicleTypeModal, setShowAddVehicleTypeModal] = useState(false);
  
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>(defaultVehicleTypes[0]);
  const [placa, setPlaca] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTickets, setActiveTickets] = useState<TicketData[]>([]);
  const [scannedTicket, setScannedTicket] = useState<TicketData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(sampleVehicles);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [showPrintNotification, setShowPrintNotification] = useState(false);
  const [connectedPort, setConnectedPort] = useState<any>(null);
  
  // Estados para lector de código de barras
  const [isBarcodeReaderConnected, setIsBarcodeReaderConnected] = useState(false);
  const [showBarcodeConfig, setShowBarcodeConfig] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const [barcodeNotification, setBarcodeNotification] = useState('');
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Convertir ParkingTicket a TicketData
  const parkingTicketToTicketData = (parkingTicket: any): TicketData => {
    // Función auxiliar para convertir fechas de manera segura
    const safeParseDate = (dateValue: any): Date | undefined => {
      if (!dateValue) return undefined;
      
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? undefined : dateValue;
      }
      
      if (typeof dateValue === 'string') {
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? undefined : parsed;
      }
      
      return undefined;
    };

    const entryTime = safeParseDate(parkingTicket.entryTime) || new Date();
    const exitTime = safeParseDate(parkingTicket.exitTime);

    return {
      id: parkingTicket.id || parkingTicket.vehicleId,
      barcode: parkingTicket.barcode || `WCW${Date.now()}`, // Usar barcode existente o generar uno nuevo
      placa: parkingTicket.placa,
      vehicleType: parkingTicket.vehicleType || 'car',
      fechaEntrada: entryTime,
      fechaSalida: exitTime,
      tiempoTotal: parkingTicket.totalMinutes ? `${Math.floor(parkingTicket.totalMinutes / 60).toString().padStart(2, '0')}H${(parkingTicket.totalMinutes % 60).toString().padStart(2, '0')}M` : undefined,
      valorPagar: parkingTicket.totalAmount || 0,
      estado: parkingTicket.status === 'active' ? 'activo' : 'pagado'
    };
  };

  // Función para debug del IndexedDB
  const debugIndexedDB = async () => {
    try {
      console.log('� Debug de IndexedDB...');
      
      // Abrir la base de datos directamente
      const request = indexedDB.open('ParkingSystem', 1);
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['parking_tickets'], 'readonly');
        const objectStore = transaction.objectStore('parking_tickets');
        const getAllRequest = objectStore.getAll();
        
        getAllRequest.onsuccess = () => {
          const tickets = getAllRequest.result;
          console.log('� Tickets en IndexedDB:', tickets);
          console.log('📊 Cantidad de tickets:', tickets.length);
          
          // Filtrar activos
          const activeTickets = tickets.filter(ticket => 
            !ticket.exitTime && (ticket.status === 'activo' || ticket.status === 'active')
          );
          console.log('🎫 Tickets activos en IndexedDB:', activeTickets);
          console.log('🎫 Cantidad de tickets activos:', activeTickets.length);
        };
      };
      
    } catch (error) {
      console.error('❌ Error en debug IndexedDB:', error);
    }
  };

  // Cargar datos del parqueadero usando el nuevo sistema
  const loadParkingData = async () => {
    try {
      console.log('🔄 Cargando datos del parqueadero con sistema mejorado...');
      
      // Debug: Verificar estado de tickets
      await parkingSystem.debugTicketStatus();
      
      // Limpiar duplicados y tickets completados incorrectos
      await parkingSystem.cleanupDuplicates();
      await parkingSystem.forceCleanCompletedTickets();
      
      // Cargar tickets activos sin duplicados
      const tickets = await parkingSystem.getActiveTickets();
      console.log('🎫 Tickets activos obtenidos:', tickets);
      
      // DEBUG: Mostrar detalles de cada ticket
      tickets.forEach((ticket, index) => {
        console.log(`🔍 Ticket ${index + 1}:`, {
          id: ticket.id,
          placa: ticket.placa,
          vehicleType: ticket.vehicleType, // ✅ Ver qué tipo tiene
          status: ticket.status,
          isPaid: ticket.isPaid,
          exitTime: ticket.exitTime,
          entryTime: ticket.entryTime
        });
      });
      
      // Filtrar ESTRICTAMENTE solo tickets que realmente estén activos
      const reallyActiveTickets = tickets.filter(ticket => {
        const isActive = ticket.status === 'active' && !ticket.isPaid && !ticket.exitTime;
        console.log(`🚦 Ticket ${ticket.placa} (${ticket.id}): ${isActive ? 'ACTIVO' : 'INACTIVO'} - Status: ${ticket.status}, Paid: ${ticket.isPaid}, Exit: ${ticket.exitTime ? 'SI' : 'NO'}`);
        return isActive;
      });
      
      console.log(`📊 Tickets filtrados: ${tickets.length} -> ${reallyActiveTickets.length} realmente activos`);
      
      if (reallyActiveTickets && reallyActiveTickets.length > 0) {
        const convertedTickets = reallyActiveTickets.map(parkingTicketToTicketData);
        setActiveTickets(convertedTickets);
        console.log(`✅ Cargados ${convertedTickets.length} tickets activos únicos`);
        console.log('📝 Tickets activos finales:', convertedTickets.map(t => `${t.placa} (${t.estado})`));
      } else {
        console.log('ℹ️ No se encontraron tickets realmente activos');
        setActiveTickets([]);
      }

      // Cargar historial de vehículos
      const vehiclesHistory = await dualDatabase.getParkingHistory();
      if (vehiclesHistory && vehiclesHistory.length > 0) {
        setVehicles(vehiclesHistory);
        console.log(`✅ Cargados ${vehiclesHistory.length} registros de historial`);
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos del parqueadero:', error);
    }
  };

  // Guardar ticket en base de datos dual
  const saveParkingTicket = async (ticket: TicketData) => {
    try {
      console.log('💾 Guardando ticket en base de datos dual...', ticket.id);
      await dualDatabase.saveParkingTicket(ticket);
      console.log('✅ Ticket guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando ticket:', error);
    }
  };

  // Guardar registro de vehículo en historial
  const saveParkingRecord = async (vehicle: VehicleRecord) => {
    try {
      console.log('💾 Guardando registro de vehículo...', vehicle.placa);
      await dualDatabase.saveParkingRecord(vehicle);
      console.log('✅ Registro de vehículo guardado');
    } catch (error) {
      console.error('❌ Error guardando registro:', error);
    }
  };

  // Actualizar registro de vehículo existente
  const updateParkingRecord = async (vehicle: VehicleRecord) => {
    try {
      console.log('🔄 Actualizando registro de vehículo...', vehicle.placa);
      await dualDatabase.saveParkingRecord(vehicle);
      console.log('✅ Registro de vehículo actualizado');
    } catch (error) {
      console.error('❌ Error actualizando registro:', error);
    }
  };

  // Actualizar ticket existente
  const updateParkingTicket = async (ticket: TicketData) => {
    try {
      console.log('🔄 Actualizando ticket...', ticket.id);
      await dualDatabase.updateParkingTicket(ticket);
      console.log('✅ Ticket actualizado');
    } catch (error) {
      console.error('❌ Error actualizando ticket:', error);
    }
  };

  // === FUNCIONES PARA TIPOS DE VEHÍCULOS ===
  
  // Cargar tipos de vehículos dinámicos
  const loadVehicleTypes = async () => {
    try {
      const localDB = getLocalDB();
      const customTypes = await localDB.getVehicleTypes();
      
      // Combinar tipos predeterminados con tipos personalizados
      const combinedTypes: VehicleType[] = [
        ...defaultVehicleTypes,
        ...customTypes.map(customType => ({
          id: customType.id,
          name: customType.name,
          icon: iconMap[customType.iconName] || Car,
          tarifa: customType.tarifa
        }))
      ];
      
      setVehicleTypes(combinedTypes);
      
      // Actualizar el tipo seleccionado si es necesario
      if (!combinedTypes.some(type => type.id === selectedVehicleType.id)) {
        setSelectedVehicleType(combinedTypes[0]);
      }
      
      console.log('✅ Tipos de vehículos cargados:', combinedTypes.length);
    } catch (error) {
      console.error('❌ Error cargando tipos de vehículos:', error);
    }
  };

  // Agregar nuevo tipo de vehículo
  const handleAddVehicleType = async (newType: VehicleType) => {
    try {
      const localDB = getLocalDB();
      
      const vehicleTypeConfig: VehicleTypeConfig = {
        id: newType.id,
        name: newType.name,
        iconName: 'Car', // Por ahora usamos Car como default
        tarifa: newType.tarifa,
        isCustom: true,
        createdAt: new Date()
      };

      await localDB.saveVehicleType(vehicleTypeConfig);
      
      // Recargar tipos de vehículos
      await loadVehicleTypes();
      
      // Emitir evento para notificar a otros componentes
      appEvents.emit(APP_EVENTS.VEHICLE_TYPE_ADDED, vehicleTypeConfig);
      
      console.log('✅ Nuevo tipo de vehículo agregado:', newType.name);
    } catch (error) {
      console.error('❌ Error agregando tipo de vehículo:', error);
      alert('Error al agregar el tipo de vehículo: ' + (error as Error).message);
    }
  };

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
      
      // Verificar si el logo existe
      const img = new Image();
      img.onload = () => console.log('✅ Logo empresa cargado correctamente');
      img.onerror = () => console.warn('⚠️ Logo empresa no encontrado en /images/company-logo.jpg');
      img.src = '/images/company-logo.jpg';

      // Cargar datos del parqueadero desde la base de datos
      loadParkingData();
      
      return () => clearInterval(interval);
    }
  }, [isHydrated]);

  // Cargar tipos de vehículos dinámicos
  useEffect(() => {
    if (isHydrated) {
      loadVehicleTypes();
    }
  }, [isHydrated]);

  // Configurar lector de código de barras
  useEffect(() => {
    if (!isHydrated) return;

    // Verificar estado del lector
    const updateBarcodeReaderStatus = () => {
      const status = barcodeReaderService.getStatus();
      setIsBarcodeReaderConnected(status.isConnected);
    };

    // Configurar callback para códigos escaneados
    const handleBarcodeScanned = async (barcode: string) => {
      console.log('📊 Código de barras escaneado:', barcode);
      setLastScannedBarcode(barcode);
      setBarcodeNotification(`📊 Código escaneado: ${barcode}`);
      
      // Ocultar notificación después de 3 segundos
      setTimeout(() => setBarcodeNotification(''), 3000);

      // Buscar ticket por código de barras
      const ticket = activeTickets.find(t => t.barcode === barcode);
      if (ticket) {
        console.log('🎫 Ticket encontrado para salida:', ticket);
        setScannedTicket(ticket);
        setShowPayment(true);
      } else {
        // Si no se encuentra el ticket, buscar en vehículos
        const vehicle = vehicles.find(v => v.barcode === barcode);
        if (vehicle && vehicle.ticketData) {
          console.log('🚗 Vehículo encontrado para salida:', vehicle);
          setScannedTicket(vehicle.ticketData);
          setShowPayment(true);
        } else {
          setBarcodeNotification(`⚠️ No se encontró ticket para el código: ${barcode}`);
        }
      }
    };

    // Configurar callbacks del servicio
    barcodeReaderService.onBarcode(handleBarcodeScanned);
    barcodeReaderService.onConnection(() => {
      updateBarcodeReaderStatus();
      setBarcodeNotification('✅ Lector de código de barras conectado');
      setTimeout(() => setBarcodeNotification(''), 3000);
    });
    barcodeReaderService.onDisconnection(() => {
      updateBarcodeReaderStatus();
      setBarcodeNotification('⚠️ Lector de código de barras desconectado');
      setTimeout(() => setBarcodeNotification(''), 3000);
    });

    // Estado inicial
    updateBarcodeReaderStatus();
  }, [isHydrated, activeTickets, vehicles]);

  // Generar código de barras único más profesional
  const generateBarcode = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    // Formato: WCW + YYYYMMDDHHMMSS + RANDOM
    return `WCW${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  };

  // Calcular tiempo transcurrido
  const calculateTime = (entrada: Date, salida: Date = new Date()) => {
    const diffMs = salida.getTime() - entrada.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}H${minutes.toString().padStart(2, '0')}M`;
  };

  // Calcular costo
  const calculateCost = (entrada: Date, salida: Date, tarifa: number) => {
    const diffMs = salida.getTime() - entrada.getTime();
    const hours = Math.ceil(diffMs / (1000 * 60 * 60)); // Redondear hacia arriba
    return Math.max(hours * tarifa, tarifa); // Mínimo 1 hora
  };

  // Detectar y usar el mejor método de impresión
  const smartPrint = (data: { type: 'entry' | 'exit', ticket: TicketData, vehicleType?: VehicleType }) => {
    // Prioridad 1: Impresora POS térmica conectada via Serial
    if (connectedPort) {
      console.log('Usando impresora POS térmica via Serial');
      printToPOS(data);
      return;
    }
    
    // Prioridad 2: Impresora detectada como conectada
    if (isPrinterConnected) {
      console.log('Usando impresora POS térmica');
      printThermalTicket(data);
      return;
    }
    
    // Prioridad 3: Detectar impresoras del sistema
    if (navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const printers = devices.filter(device => 
            device.label.toLowerCase().includes('pos') ||
            device.label.toLowerCase().includes('thermal') ||
            device.label.toLowerCase().includes('receipt')
          );
          
          if (printers.length > 0) {
            console.log('Impresora térmica detectada:', printers[0].label);
            printThermalTicket(data);
          } else {
            console.log('Usando diseño térmico por defecto');
            printThermalTicket(data);
          }
        })
        .catch(() => {
          // Fallback: usar diseño térmico
          printThermalTicket(data);
        });
    } else {
      // Fallback: usar diseño térmico
      printThermalTicket(data);
    }
  };

  // Generar ticket de entrada profesional
  const generateEntryTicket = async () => {
    if (!placa.trim()) {
      alert('Por favor ingrese la placa del vehículo');
      return;
    }

    try {
      console.log('🚗 Generando ticket de entrada para:', placa.toUpperCase());
      
      // Usar el sistema de parqueadero para procesar entrada
      console.log('🔍 DEBUG - selectedVehicleType completo:', selectedVehicleType);
      console.log('🔍 DEBUG - ID del tipo:', selectedVehicleType.id);
      console.log('🔍 DEBUG - Nombre del tipo:', selectedVehicleType.name);
      
      const newTicket = await parkingSystem.processEntry(
        placa.toUpperCase(),
        selectedVehicleType.id, // ✅ Pasar el ID, no el nombre
        selectedVehicleType.tarifa
      );
      
      console.log('✅ Ticket generado por parkingSystem:', newTicket);
      console.log('✅ vehicleType en ticket:', newTicket.vehicleType);

      // Convertir el ticket del sistema a formato TicketData para el frontend
      const ticketForFrontend: TicketData = {
        id: newTicket.id,
        barcode: newTicket.barcode || generateBarcode(), // Usar barcode generado o crear uno nuevo
        placa: newTicket.placa,
        vehicleType: newTicket.vehicleType,
        fechaEntrada: newTicket.entryTime,
        estado: 'activo'
      };

      // Crear registro de vehículo para el historial local
      const newVehicle: VehicleRecord = {
        id: vehicles.length + 1,
        vehiculo: selectedVehicleType.name,
        placa: placa.toUpperCase(),
        tipo: 'Por Fracción',
        entrada: new Date().toLocaleString('es-CO'),
        salida: '-',
        tiempo: '-',
        estado: 'Parqueado',
        cobro: 0,
        barcode: ticketForFrontend.barcode, // Usar el barcode del ticket del frontend
        ticketData: ticketForFrontend
      };

      // Actualizar estado local del frontend
      setActiveTickets(prev => [...prev, ticketForFrontend]);
      setVehicles(prev => [...prev, newVehicle]);

      // Guardar registro histórico adicional
      await saveParkingRecord(newVehicle);
      
      // Usar sistema inteligente de detección de impresora
      smartPrint({
        type: 'entry',
        ticket: ticketForFrontend,
        vehicleType: selectedVehicleType
      });
      
      // Mostrar notificación de impresión
      setShowPrintNotification(true);
      setTimeout(() => setShowPrintNotification(false), 3000);
      
      setPlaca('');
      setShowNewVehicleModal(false);
      
      // Recargar datos para asegurar sincronización completa
      console.log('🔄 Recargando datos del parqueadero después de entrada...');
      await loadParkingData();
      
      // Recarga adicional después de un pequeño delay para asegurar sincronización
      setTimeout(async () => {
        console.log('🔄 Recarga adicional de datos después de entrada...');
        await loadParkingData();
      }, 1000);
      
      console.log('✅ Ticket de entrada procesado completamente');
      
    } catch (error) {
      console.error('❌ Error generando ticket de entrada:', error);
      alert('Error al generar el ticket de entrada');
    }
  };

  // Imprimir ticket de entrada
  const printEntryTicket = (ticket: TicketData) => {
    // Generar PDF para preview/backup
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 120]
    });

    // Header con logo
    doc.setFontSize(12);
    doc.text('WILSON CARS & WASH', 40, 15, { align: 'center' });
    doc.setFontSize(8);
    doc.text('PARKING PROFESSIONAL', 40, 20, { align: 'center' });
    doc.text('NIT: 19475534', 40, 25, { align: 'center' });
    
    // Línea separadora
    doc.line(5, 30, 75, 30);
    
    // Información del ticket
    doc.setFontSize(10);
    doc.text('TICKET DE ENTRADA', 40, 40, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Placa: ${ticket.placa}`, 10, 50);
    doc.text(`Vehículo: ${ticket.vehicleType}`, 10, 55);
    doc.text(`Fecha: ${ticket.fechaEntrada.toLocaleDateString('es-CO')}`, 10, 60);
    doc.text(`Hora: ${ticket.fechaEntrada.toLocaleTimeString('es-CO')}`, 10, 65);
    doc.text(`Tarifa: $${selectedVehicleType.tarifa}/hora`, 10, 70);
    
    // Código de barras
    doc.text(`Código: ${ticket.barcode}`, 10, 80);
    
    if (canvasRef.current) {
      JsBarcode(canvasRef.current, ticket.barcode, {
        format: "CODE128",
        width: 1,
        height: 40,
        displayValue: false
      });
      
      const barcodeDataUrl = canvasRef.current.toDataURL();
      doc.addImage(barcodeDataUrl, 'PNG', 10, 85, 60, 15);
    }
    
    // Footer
    doc.setFontSize(6);
    doc.text('Conserve este ticket para la salida', 40, 110, { align: 'center' });
    
    // Abrir en nueva ventana para imprimir
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');

    // Enviar a impresora POS térmica
    printToPOS({
      type: 'entry',
      ticket: ticket,
      vehicleType: selectedVehicleType
    });
  };

  // Procesar salida de vehículo usando el nuevo sistema
  const processExit = async (ticket: TicketData) => {
    try {
      console.log('🚗 Procesando salida de vehículo:', ticket.placa);
      console.log('🔍 ID del ticket para procesar salida:', ticket.id);
      console.log('🎫 Ticket completo:', ticket);
      
      // Mostrar mensaje de procesamiento
      const processingToast = document.createElement('div');
      processingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      processingToast.innerHTML = `🔄 Procesando salida de ${ticket.placa}...`;
      document.body.appendChild(processingToast);
      
      // Usar el nuevo sistema de parqueadero
      const updatedTicket = await parkingSystem.processExit(ticket.id);
      
      // Crear ticket formateado para la factura
      const ticketForPrint: TicketData = {
        ...ticket,
        fechaSalida: updatedTicket.exitTime,
        valorPagar: updatedTicket.totalAmount || 0,
        estado: 'pagado',
        tiempoTotal: updatedTicket.totalMinutes ? `${Math.floor(updatedTicket.totalMinutes / 60)}h ${updatedTicket.totalMinutes % 60}min` : '0min'
      };
      
      // INMEDIATAMENTE actualizar estado local - remover de tickets activos
      setActiveTickets(prev => {
        const filtered = prev.filter(t => t.id !== ticket.id);
        console.log(`📅 Tickets activos actualizados: ${prev.length} -> ${filtered.length}`);
        return filtered;
      });
      
      // Generar factura bonita de salida
      smartPrint({
        type: 'exit',
        ticket: ticketForPrint,
        vehicleType: selectedVehicleType
      });
      
      // Recargar datos para reflejar cambios
      console.log('🔄 Recargando datos del parqueadero...');
      await loadParkingData();
      
      // Recargar datos adicional después de un pequeño delay para asegurar sincronización
      setTimeout(async () => {
        console.log('🔄 Recarga adicional de datos...');
        await loadParkingData();
      }, 1000);
      
      // Remover mensaje de procesamiento
      if (document.body.contains(processingToast)) {
        document.body.removeChild(processingToast);
      }
      
      // Mostrar mensaje de éxito
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successToast.innerHTML = `✅ ${ticket.placa} - $${updatedTicket.totalAmount?.toLocaleString('es-CO')} - ${ticketForPrint.tiempoTotal}`;
      document.body.appendChild(successToast);
      
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 4000);
      
      console.log(`✅ Salida procesada: ${ticket.placa} - $${updatedTicket.totalAmount} - ${ticketForPrint.tiempoTotal}`);
      
    } catch (error) {
      console.error('❌ Error procesando salida:', error);
      
      // Remover mensaje de procesamiento si existe
      const processingElement = document.querySelector('.fixed.bg-blue-600');
      if (processingElement) {
        document.body.removeChild(processingElement);
      }
      
      // Mostrar error
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorToast.innerHTML = `❌ Error: ${error}`;
      document.body.appendChild(errorToast);
      
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 4000);
    }
  };

  // Imprimir ticket de salida
  const printExitTicket = (ticket: TicketData) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 140]
    });

    // Header
    doc.setFontSize(12);
    doc.text('WILSON CARS & WASH', 40, 15, { align: 'center' });
    doc.setFontSize(8);
    doc.text('PARKING PROFESSIONAL', 40, 20, { align: 'center' });
    doc.text('NIT: 19475534', 40, 25, { align: 'center' });
    
    doc.line(5, 30, 75, 30);
    
    doc.setFontSize(10);
    doc.text('FACTURA DE SALIDA', 40, 40, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Placa: ${ticket.placa}`, 10, 50);
    doc.text(`Vehículo: ${ticket.vehicleType}`, 10, 55);
    doc.text(`Entrada: ${ticket.fechaEntrada.toLocaleString('es-CO')}`, 10, 60);
    doc.text(`Salida: ${ticket.fechaSalida?.toLocaleString('es-CO')}`, 10, 65);
    doc.text(`Tiempo: ${ticket.tiempoTotal}`, 10, 70);
    
    doc.line(5, 75, 75, 75);
    
    doc.setFontSize(10);
    doc.text(`TOTAL A PAGAR: $${ticket.valorPagar?.toLocaleString('es-CO')}`, 40, 85, { align: 'center' });
    
    doc.line(5, 90, 75, 90);
    
    doc.setFontSize(6);
    doc.text('Gracias por usar nuestros servicios', 40, 100, { align: 'center' });
    doc.text('¡Vuelva pronto!', 40, 105, { align: 'center' });
    
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');

    // Enviar a impresora POS térmica
    printToPOS({
      type: 'exit',
      ticket: ticket
    });
  };

  // Función optimizada para imprimir en impresora POS térmica
  const printToPOS = (data: { type: 'entry' | 'exit', ticket: TicketData, vehicleType?: VehicleType }) => {
    try {
      // Crear contenido ESC/POS optimizado para papel térmico
      let content = '';
      
      // Comandos ESC/POS estándar
      const ESC = '\x1B';
      const GS = '\x1D';
      const LF = '\x0A';
      
      // Inicializar impresora térmica
      content += ESC + '@'; // Inicializar
      content += ESC + 'a' + '\x01'; // Centrar texto
      
      // Header para papel térmico (más compacto)
      content += ESC + '!' + '\x08'; // Texto doble altura
      content += 'WILSON CARS & WASH' + LF;
      content += ESC + '!' + '\x00'; // Texto normal
      content += 'PARKING PROFESSIONAL' + LF;
      content += 'NIT: 19.475.534-7' + LF;
      content += '================================' + LF;
      content += LF;
      
      if (data.type === 'entry') {
        content += ESC + 'a' + '\x01'; // Centrar
        content += ESC + '!' + '\x18'; // Texto doble tamaño
        content += 'TICKET DE ENTRADA' + LF;
        content += ESC + '!' + '\x00'; // Texto normal
        content += ESC + 'a' + '\x00'; // Alinear izquierda
        content += '================================' + LF;
        
        content += `Placa:           ${data.ticket.placa}` + LF;
        content += `Vehiculo:        ${data.ticket.vehicleType}` + LF;
        content += `Fecha:           ${data.ticket.fechaEntrada.toLocaleDateString('es-CO')}` + LF;
        content += `Hora:            ${data.ticket.fechaEntrada.toLocaleTimeString('es-CO')}` + LF;
        if (data.vehicleType) {
          content += `Tarifa/Hora:     $${data.vehicleType.tarifa.toLocaleString('es-CO')}` + LF;
        }
        content += '--------------------------------' + LF;
        content += `Codigo:          ${data.ticket.barcode}` + LF;
        content += '--------------------------------' + LF;
        
        // Código de barras simplificado para térmica
        content += ESC + 'a' + '\x01'; // Centrar
        content += 'CODIGO DE CONTROL' + LF;
        content += '|||  ||  ||  ||||  ||  |||  ||||  ||  |||  ||' + LF;
        content += '|||  ||  ||  ||||  ||  |||  ||||  ||  |||  ||' + LF;
        content += '|||  ||  ||  ||||  ||  |||  ||||  ||  |||  ||' + LF;
        content += LF;
        
        content += ESC + '!' + '\x08'; // Texto doble altura
        content += 'CONSERVE ESTE TICKET' + LF;
        content += 'PARA LA SALIDA' + LF;
        content += ESC + '!' + '\x00'; // Texto normal
        
      } else {
        content += ESC + 'a' + '\x01'; // Centrar
        content += ESC + '!' + '\x18'; // Texto doble tamaño
        content += 'FACTURA DE SALIDA' + LF;
        content += ESC + '!' + '\x00'; // Texto normal
        content += ESC + 'a' + '\x00'; // Alinear izquierda
        content += '================================' + LF;
        
        content += `Placa:           ${data.ticket.placa}` + LF;
        content += `Vehiculo:        ${data.ticket.vehicleType}` + LF;
        content += `Entrada:         ${data.ticket.fechaEntrada.toLocaleString('es-CO')}` + LF;
        content += `Salida:          ${data.ticket.fechaSalida?.toLocaleString('es-CO')}` + LF;
        content += `Tiempo Total:    ${data.ticket.tiempoTotal}` + LF;
        content += '================================' + LF;
        
        content += ESC + 'a' + '\x01'; // Centrar
        content += ESC + '!' + '\x38'; // Texto muy grande
        content += `TOTAL: $${data.ticket.valorPagar?.toLocaleString('es-CO')}` + LF;
        content += ESC + '!' + '\x00'; // Texto normal
        content += '================================' + LF;
        
        content += ESC + '!' + '\x08'; // Texto doble altura
        content += 'GRACIAS POR SU VISITA' + LF;
        content += 'VUELVA PRONTO!' + LF;
        content += ESC + '!' + '\x00'; // Texto normal
      }
      
      content += LF;
      content += '--------------------------------' + LF;
      content += ESC + 'a' + '\x01'; // Centrar
      content += 'Wilson Cars & Wash' + LF;
      content += 'Tel: +57 (1) 234-5678' + LF;
      content += 'www.wilsoncarwash.com' + LF;
      content += 'Atencion 24/7' + LF;
      content += '--------------------------------' + LF;
      content += `${new Date().toLocaleString('es-CO')}` + LF;
      content += `Sistema POS v2.0` + LF;
      content += LF + LF + LF; // Espacios para corte
      
      // Comando de corte para papel térmico
      content += GS + 'V' + '\x42' + '\x00'; // Cortar papel
      
      // Enviar a impresora usando Web Serial API (para impresoras USB térmicas)
      if ('serial' in navigator && connectedPort) {
        printViaSerialAPI(content);
      } else {
        // Fallback: usar ticket térmico HTML
        printThermalTicket(data);
      }
      
    } catch (error) {
      console.error('Error al imprimir en POS térmica:', error);
      // Fallback en caso de error
      printThermalTicket(data);
    }
  };

  // Función para imprimir usando Web Serial API
  const printViaSerialAPI = async (content: string) => {
    try {
      if (!connectedPort) {
        throw new Error('No hay puerto conectado. Configure la impresora primero.');
      }

      // Usar el puerto ya conectado
      const writer = connectedPort.writable.getWriter();
      const encoder = new TextEncoder();
      
      await writer.write(encoder.encode(content));
      
      writer.releaseLock();
      
      console.log('Impresión enviada a POS exitosamente');
    } catch (error) {
      console.error('Error en Web Serial API:', error);
      throw error;
    }
  };

  // Función fallback moderna para mostrar contenido de impresión
  const printFallbackModerno = (data: { type: 'entry' | 'exit', ticket: TicketData, vehicleType?: VehicleType }) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Wilson Cars & Wash - ${data.type === 'entry' ? 'Ticket de Entrada' : 'Factura de Salida'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Arial, sans-serif;
            width: 350px;
            margin: 20px auto;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .ticket {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            border: 3px solid #2563eb;
        }
        
        .header {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            color: white;
            padding: 30px 20px;
            text-align: center;
            position: relative;
        }
        
        .logo {
            width: 100px;
            height: 70px;
            background: white;
            border-radius: 15px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid rgba(255,255,255,0.3);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .logo img {
            max-width: 80px;
            max-height: 50px;
            border-radius: 8px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            letter-spacing: 1px;
        }
        
        .company-subtitle {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        
        .nit {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .ticket-type {
            background: ${data.type === 'entry' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .content {
            padding: 30px 25px;
            background: linear-gradient(180deg, #f8fafc, #f1f5f9);
        }
        
        .info-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            border-left: 6px solid #2563eb;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px dotted #cbd5e1;
            align-items: center;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .label {
            font-weight: 600;
            color: #475569;
            font-size: 15px;
        }
        
        .value {
            font-weight: bold;
            color: #1e293b;
            font-size: 15px;
        }
        
        .barcode-section {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            border: 3px dashed #2563eb;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        
        .barcode-title {
            font-size: 14px;
            color: #2563eb;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        
        .barcode-code {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            letter-spacing: 1px;
        }
        
        .barcode-visual {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            color: #2c3e50;
            margin: 15px 0;
            line-height: 1;
            background: white;
            padding: 8px;
            border-radius: 4px;
            border: 2px solid #3498db;
        }
        
        .total-section {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            margin: 25px 0;
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }
        
        .total-label {
            font-size: 18px;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .total-amount {
            font-size: 36px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .footer {
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            padding: 30px 25px;
            text-align: center;
        }
        
        .footer-message {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
            background: rgba(255,255,255,0.1);
            padding: 12px;
            border-radius: 10px;
        }
        
        .footer-contact {
            font-size: 13px;
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .security-strip {
            height: 10px;
            background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6);
            margin-top: 20px;
            border-radius: 5px;
        }
        
        @media print {
            body { margin: 0; padding: 10px; background: white; }
            .ticket { box-shadow: none; border: 2px solid #000; }
            .header, .ticket-type, .total-section, .footer {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="logo">
                <img src="/images/company-logo.jpg" alt="Logo" onerror="this.parentElement.innerHTML='<div style=&quot;font-weight:bold;color:#2563eb;font-size:12px;&quot;>WILSON<br>LOGO</div>'" />
            </div>
            <div class="company-name">WILSON CARS & WASH</div>
            <div class="company-subtitle">PARKING PROFESSIONAL</div>
            <div class="nit">NIT: 19.475.534-7</div>
        </div>
        
        <div class="ticket-type">
            ${data.type === 'entry' ? '🎫 Ticket de Entrada' : '🧾 Factura de Salida'}
        </div>
        
        <div class="content">
            <div class="info-section">
                <div class="info-row">
                    <span class="label">🚗 Placa del Vehículo</span>
                    <span class="value">${data.ticket.placa}</span>
                </div>
                <div class="info-row">
                    <span class="label">🚙 Tipo de Vehículo</span>
                    <span class="value">${data.ticket.vehicleType}</span>
                </div>
                ${data.type === 'entry' ? `
                <div class="info-row">
                    <span class="label">📅 Fecha de Entrada</span>
                    <span class="value">${data.ticket.fechaEntrada.toLocaleDateString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">🕐 Hora de Entrada</span>
                    <span class="value">${data.ticket.fechaEntrada.toLocaleTimeString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">💰 Tarifa por Hora</span>
                    <span class="value">$${data.vehicleType?.tarifa?.toLocaleString('es-CO') || '0'}</span>
                </div>
                ` : `
                <div class="info-row">
                    <span class="label">📅 Entrada</span>
                    <span class="value">${data.ticket.fechaEntrada.toLocaleString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">📅 Salida</span>
                    <span class="value">${data.ticket.fechaSalida?.toLocaleString('es-CO') || ''}</span>
                </div>
                <div class="info-row">
                    <span class="label">⏱️ Tiempo Total</span>
                    <span class="value">${data.ticket.tiempoTotal || ''}</span>
                </div>
                `}
            </div>
            
            ${data.type === 'entry' ? `
            <div class="barcode-section">
                <div class="barcode-title">🔍 Código de Control</div>
                <div class="barcode-code">${data.ticket.barcode}</div>
                <div class="barcode-visual">█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                    Escanear este código para procesar la salida
                </div>
            </div>
            ` : `
            <div class="total-section">
                <div class="total-label">💳 Total a Pagar</div>
                <div class="total-amount">$${data.ticket.valorPagar?.toLocaleString('es-CO') || '0'}</div>
            </div>
            `}
        </div>
        
        <div class="footer">
            <div class="footer-message">
                ${data.type === 'entry' ? 
                    '🔒 Conserve este ticket para la salida' : 
                    '✅ Gracias por usar nuestros servicios'
                }
            </div>
            <div class="footer-contact">
                📍 Wilson Cars & Wash<br>
                📞 NIT: 19.475.534 | 🌐 www.wilsoncarwash.com
            </div>
            <div class="security-strip"></div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>`;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Función fallback para mostrar contenido de impresión
  const printFallback = (content: string, type: 'entry' | 'exit') => {
    // Extraer información del contenido
    const lines = content.split('\n');
    let ticketData = {
      placa: '',
      vehiculo: '',
      fecha: '',
      hora: '',
      tarifa: '',
      codigo: '',
      entrada: '',
      salida: '',
      tiempo: '',
      total: ''
    };
    
    lines.forEach(line => {
      if (line.includes('Placa:')) ticketData.placa = line.split(':')[1]?.trim() || '';
      if (line.includes('Vehiculo:')) ticketData.vehiculo = line.split(':')[1]?.trim() || '';
      if (line.includes('Fecha:')) ticketData.fecha = line.split(':')[1]?.trim() || '';
      if (line.includes('Hora:')) ticketData.hora = line.split(':')[1]?.trim() || '';
      if (line.includes('Tarifa:')) ticketData.tarifa = line.split(':')[1]?.trim() || '';
      if (line.includes('Codigo:')) ticketData.codigo = line.split(':')[1]?.trim() || '';
      if (line.includes('Entrada:')) ticketData.entrada = line.split('Entrada:')[1]?.trim() || '';
      if (line.includes('Salida:')) ticketData.salida = line.split('Salida:')[1]?.trim() || '';
      if (line.includes('Tiempo:')) ticketData.tiempo = line.split(':')[1]?.trim() || '';
      if (line.includes('TOTAL:')) ticketData.total = line.split('TOTAL:')[1]?.trim() || '';
    });

    const printWindow = window.open('', '_blank', 'width=300,height=500');
    if (printWindow) {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Wilson Cars & Wash - ${type === 'entry' ? 'Ticket de Entrada' : 'Factura de Salida'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Arial, sans-serif;
            width: 280px;
            margin: 5px auto;
            background: white;
            padding: 5px;
        }
        
        .ticket {
            background: white;
            border: 1px solid #000;
        }
        
        .header {
            background: white;
            color: black;
            padding: 8px;
            text-align: center;
            border-bottom: 1px solid #000;
        }
        
        .logo {
            width: 40px;
            height: 30px;
            background: white;
            margin: 0 auto 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #000;
        }
        
        .logo img {
            max-width: 35px;
            max-height: 25px;
        }
        
        .company-name {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 2px;
            color: black;
        }
        
        .company-subtitle {
            font-size: 8px;
            margin-bottom: 2px;
            color: black;
        }
        
        .nit {
            font-size: 7px;
            color: black;
        }
        
        .ticket-type {
            background: white;
            color: black;
            padding: 8px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
        }
        
        .content {
            padding: 6px;
            background: white;
        }
        
        .info-section {
            background: white;
            padding: 6px;
            margin-bottom: 4px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .label {
            font-weight: 600;
            color: black;
            font-size: 8px;
        }
        
        .value {
            font-weight: bold;
            color: black;
            font-size: 8px;
        }
        
        .barcode-section {
            background: white;
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            margin: 6px 0;
        }
        
        .barcode-title {
            font-size: 7px;
            color: black;
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        
        .barcode-code {
            font-family: 'Courier New', monospace;
            font-size: 8px;
            font-weight: bold;
            color: black;
            background: white;
            padding: 3px;
            border: 1px solid #000;
            margin: 3px 0;
        }
        
        .barcode-visual {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 4px 0;
        }
        
        .barcode-bars {
            display: inline-block;
            width: 100px;
            height: 15px;
            background: repeating-linear-gradient(
                90deg,
                black 0px,
                black 1px,
                white 1px,
                white 3px
            );
            border: 1px solid #000;
        }
        
        .total-section {
            background: white;
            color: black;
            border: 2px solid #000;
            padding: 8px;
            text-align: center;
            margin: 6px 0;
        }
        
        .total-label {
            font-size: 8px;
            margin-bottom: 3px;
            color: black;
        }
        
        .total-amount {
            font-size: 14px;
            font-weight: bold;
            color: black;
        }
        
        .footer {
            background: white;
            color: black;
            padding: 6px;
            text-align: center;
            border-top: 1px solid #000;
        }
        
        .footer-message {
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 3px;
            text-transform: uppercase;
            background: white;
            padding: 3px;
            border: 1px solid #000;
        }
        
        .footer-contact {
            font-size: 6px;
            color: black;
            line-height: 1.2;
        }
        
        @media print {
            body { margin: 0; padding: 5px; background: white; }
            .ticket { border: 1px solid #000; }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="logo">
                <img src="/images/company-logo.jpg" alt="Logo" onerror="this.parentElement.innerHTML='<div style=&quot;font-weight:bold;color:black;font-size:6px;&quot;>WILSON</div>'" />
            </div>
            <div class="company-name">WILSON CARS & WASH</div>
            <div class="company-subtitle">PARKING PROFESSIONAL</div>
            <div class="nit">NIT: 19.475.534-7</div>
        </div>
        
        <div class="ticket-type">
            \${type === 'entry' ? 'TICKET DE ENTRADA' : 'FACTURA DE SALIDA'}
        </div>
        
        <div class="content">
            <div class="info-section">
                <div class="info-row">
                    <span class="label">PLACA</span>
                    <span class="value">\${ticketData.placa}</span>
                </div>
                <div class="info-row">
                    <span class="label">VEHICULO</span>
                    <span class="value">\${ticketData.vehiculo}</span>
                </div>
                \${type === 'entry' ? \`
                <div class="info-row">
                    <span class="label">FECHA</span>
                    <span class="value">\${ticketData.fecha}</span>
                </div>
                <div class="info-row">
                    <span class="label">HORA</span>
                    <span class="value">\${ticketData.hora}</span>
                </div>
                <div class="info-row">
                    <span class="label">TARIFA/HORA</span>
                    <span class="value">\${ticketData.tarifa}</span>
                </div>
                \` : \`
                <div class="info-row">
                    <span class="label">ENTRADA</span>
                    <span class="value">\${ticketData.entrada}</span>
                </div>
                <div class="info-row">
                    <span class="label">SALIDA</span>
                    <span class="value">\${ticketData.salida}</span>
                </div>
                <div class="info-row">
                    <span class="label">TIEMPO</span>
                    <span class="value">\${ticketData.tiempo}</span>
                </div>
                \`}
            </div>
            
            \${type === 'entry' ? \`
            <div class="barcode-section">
                <div class="barcode-title">CODIGO DE CONTROL</div>
                <div class="barcode-code">\${ticketData.codigo}</div>
                <div class="barcode-visual">█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█</div>
                <div style="font-size: 6px; color: black; margin-top: 3px;">
                    Conservar para salida
                </div>
            </div>
            \` : \`
            <div class="total-section">
                <div class="total-label">TOTAL A PAGAR</div>
                <div class="total-amount">\${ticketData.total}</div>
            </div>
            \`}
        </div>
        
        <div class="footer">
            <div class="footer-message">
                \${type === 'entry' ? 
                    'CONSERVE ESTE TICKET' : 
                    'GRACIAS POR SU VISITA'
                }
            </div>
            <div class="footer-contact">
                Wilson Cars & Wash<br>
                NIT: 19.475.534 | www.wilsoncarwash.com
            </div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>\`;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };
<body>
    <div class="ticket">
        <div class="header">
            <div class="logo">
                <img src="/images/company-logo.jpg" alt="Logo" onerror="this.parentElement.innerHTML='<div style=&quot;font-weight:bold;color:#2563eb;font-size:12px;&quot;>WILSON<br>LOGO</div>'" />
            </div>
            <div class="company-name">WILSON CARS & WASH</div>
            <div class="company-subtitle">PARKING PROFESSIONAL</div>
            <div class="nit">NIT: 19.475.534-7</div>
        </div>
        
        <div class="ticket-type">
            ${type === 'entry' ? '🎫 Ticket de Entrada' : '🧾 Factura de Salida'}
        </div>
        
        <div class="content">
            <div class="info-section">
                <div class="info-row">
                    <span class="label">🚗 Placa del Vehículo</span>
                    <span class="value">${ticketData.placa}</span>
                </div>
                <div class="info-row">
                    <span class="label">🚙 Tipo de Vehículo</span>
                    <span class="value">${ticketData.vehiculo}</span>
                </div>
                ${type === 'entry' ? `
                <div class="info-row">
                    <span class="label">📅 Fecha de Entrada</span>
                    <span class="value">${ticketData.fecha}</span>
                </div>
                <div class="info-row">
                    <span class="label">🕐 Hora de Entrada</span>
                    <span class="value">${ticketData.hora}</span>
                </div>
                <div class="info-row">
                    <span class="label">💰 Tarifa por Hora</span>
                    <span class="value">${ticketData.tarifa}</span>
                </div>
                ` : `
                <div class="info-row">
                    <span class="label">� Entrada</span>
                    <span class="value">${ticketData.entrada}</span>
                </div>
                <div class="info-row">
                    <span class="label">� Salida</span>
                    <span class="value">${ticketData.salida}</span>
                </div>
                <div class="info-row">
                    <span class="label">⏱️ Tiempo Total</span>
                    <span class="value">${ticketData.tiempo}</span>
                </div>
                `}
            </div>
            
            ${type === 'entry' ? `
            <div class="barcode-section">
                <div class="barcode-title">� Código de Control</div>
                <div class="barcode-code">${ticketData.codigo}</div>
                <div class="barcode-visual">||||| |||| ||||| |||| |||||</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                    Escanear este código para procesar la salida
                </div>
            </div>
            ` : `
            <div class="total-section">
                <div class="total-label">💳 Total a Pagar</div>
                <div class="total-amount">${ticketData.total}</div>
            </div>
            `}
        </div>
        
        <div class="footer">
            <div class="footer-message">
                ${type === 'entry' ? 
                    '🔒 Conserve este ticket para la salida' : 
                    '✅ Gracias por usar nuestros servicios'
                }
            </div>
            <div class="footer-contact">
                📍 Wilson Cars & Wash<br>
                📞 NIT: 19.475.534 | 🌐 www.wilsoncarwash.com
            </div>
            <div class="security-strip"></div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>`;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Inicializar escáner
  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    const scanner = new Html5QrcodeScanner(
      'qr-scanner',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Buscar ticket activo por código de barras
        const ticket = activeTickets.find(t => t.barcode === decodedText);
        if (ticket) {
          processExit(ticket);
          scanner.clear();
        } else {
          alert('Ticket no encontrado o ya procesado');
        }
      },
      (error) => {
        console.log('Scanner error:', error);
      }
    );

    scannerRef.current = scanner;
  };

  // Configurar conexión con impresora POS
  const setupPrinterConnection = async () => {
    try {
      if ('serial' in navigator) {
        // Solicitar conexión a impresora (solo se puede hacer en respuesta a gesto del usuario)
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: 9600 });
        setConnectedPort(port);
        setIsPrinterConnected(true);
        alert('Impresora POS configurada exitosamente');
      } else {
        alert('Su navegador no soporta conexión directa a impresora POS. Se usará impresión estándar.');
      }
    } catch (error) {
      console.error('Error al configurar impresora:', error);
      alert('Error al conectar con la impresora POS. Verifique que esté conectada y encendida.');
    }
  };

  // Verificar estado de la impresora al cargar
  useEffect(() => {
    const checkPrinterStatus = async () => {
      if ('serial' in navigator) {
        try {
          const ports = await (navigator as any).serial.getPorts();
          setIsPrinterConnected(ports.length > 0);
        } catch (error) {
          console.error('Error checking printer status:', error);
        }
      }
    };
    
    if (isHydrated) {
      checkPrinterStatus();
    }
  }, [isHydrated]);

  // Cleanup del escáner
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  // Función para obtener el nombre del tipo de vehículo
  const getVehicleTypeName = (vehicleTypeId: string): string => {
    // Tipos predeterminados
    if (vehicleTypeId === 'car') return 'Carro';
    if (vehicleTypeId === 'motorcycle') return 'Moto';
    if (vehicleTypeId === 'truck') return 'Camión';
    
    // Buscar en tipos personalizados cargados
    const customType = vehicleTypes.find(vt => vt.id === vehicleTypeId);
    if (customType) {
      return customType.name;
    }
    
    // Si no se encuentra, retornar el ID
    return vehicleTypeId;
  };

  // Filtrar vehículos - combinar tickets activos con historial
  const allVehicles = [
    // Convertir tickets activos a formato de vehículo para la tabla
    ...activeTickets.map(ticket => ({
      id: ticket.id,
      vehiculo: getVehicleTypeName(ticket.vehicleType),
      placa: ticket.placa,
      tipo: 'Por Fracción', // Los activos siempre son por fracción
      entrada: ticket.fechaEntrada.toLocaleString('es-CO'),
      salida: '—', // Sin salida porque están activos
      tiempo: '—', // Sin tiempo porque están activos
      estado: 'Parqueado',
      cobro: 0, // Sin cobro hasta que salgan
      barcode: ticket.barcode,
      isActive: true, // Marca para identificar que es un ticket activo
      ticketData: ticket // Agregar los datos del ticket para usar en las acciones
    })),
    // Agregar vehículos del historial (que ya salieron) - solo los completados del día de hoy
    ...vehicles.filter(vehicle => {
      // Solo mostrar vehículos que salieron hoy
      const today = new Date().toDateString();
      const vehicleDate = vehicle.salida !== '—' ? new Date(vehicle.salida).toDateString() : null;
      return vehicle.estado === 'Salió' && vehicleDate === today;
    })
  ];
  
  // Debug: Log para ver qué se está mostrando
  console.log('🚗 Tickets activos para tabla:', activeTickets.length);
  console.log('📜 Vehículos historial:', vehicles.length);
  console.log('🔀 Total vehículos combinados:', allVehicles.length);
  console.log('📋 Vehículos combinados:', allVehicles);

  const filteredVehicles = allVehicles.filter(vehicle => {
    const matchesSearch = vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedVehicleType.name === 'Todos los tipos' || 
                       vehicle.vehiculo === selectedVehicleType.name;
    return matchesSearch && matchesType;
  });
  
  console.log('🔍 Vehículos filtrados:', filteredVehicles.length);
  console.log('📊 Datos filtrados:', filteredVehicles);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
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
              <div className="flex items-center gap-4 mb-1">
                {/* Estado Impresora POS */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPrinterConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    Impresora POS {isPrinterConnected ? 'Conectada' : 'Desconectada'}
                  </span>
                  {!isPrinterConnected && (
                    <button
                      onClick={setupPrinterConnection}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Conectar POS
                    </button>
                  )}
                  {isPrinterConnected && (
                    <button
                      onClick={() => {
                        if (connectedPort) {
                          connectedPort.close();
                          setConnectedPort(null);
                        }
                        setIsPrinterConnected(false);
                      }}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
                
                {/* Estado Lector de Código de Barras */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isBarcodeReaderConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    📊 Lector {isBarcodeReaderConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                  <button
                    onClick={() => setShowBarcodeConfig(!showBarcodeConfig)}
                    className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    {showBarcodeConfig ? 'Ocultar' : 'Configurar'}
                  </button>
                </div>
                
                <span className="text-xs font-medium text-green-600">Bienvenido Wilson González</span>
              </div>
              <div className="text-sm font-mono font-bold text-gray-800">{currentTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Type Selection */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Tipo de Vehículo</h2>
            <button
              onClick={() => setShowAddVehicleTypeModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Tipo</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {vehicleTypes.map((type, index) => (
              <motion.button
                key={`vehicle-type-${type.id || 'unknown'}-${index}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedVehicleType(type)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedVehicleType.id === type.id
                    ? 'border-orange-400 bg-orange-50 text-orange-700' 
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <type.icon className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">{type.name}</span>
                <div className="text-xs text-gray-500 mt-1">${type.tarifa}/hora</div>
              </motion.button>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-gray-700 font-medium">Placa del vehículo</label>
            </div>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Ingresa la placa del vehículo"
              className="w-full p-4 border-2 border-yellow-400 rounded-xl bg-yellow-50 text-gray-800 text-center text-lg font-bold uppercase"
              maxLength={7}
            />
          </div>
          
          <div className="mt-6 flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateEntryTicket}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5" />
                <Printer className="w-4 h-4" />
              </div>
              <span>Generar e Imprimir Ticket</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowScanner(true);
                setTimeout(startScanner, 100);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Scan className="w-5 h-5" />
              Escanear Salida
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => loadParkingData()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-4 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              ♻️ Debug Datos
            </motion.button>
          </div>
        </div>
      </div>

      {/* Panel de configuración del lector de código de barras */}
      <AnimatePresence>
        {showBarcodeConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <BarcodeReaderConfig
              onBarcodeScanned={(barcode) => {
                // Esta función ya se maneja en el useEffect
                console.log('Código de barras recibido desde el componente:', barcode);
              }}
              showTestArea={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificación de código de barras */}
      <AnimatePresence>
        {barcodeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {barcodeNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration History */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">
            Registro de ingresos y salidas
          </h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por placa..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <SyncButton 
              onSyncComplete={(success, results) => {
                if (success) {
                  console.log('✅ Sincronización completada desde botón:', results);
                  loadParkingData(); // Recargar datos después de sincronización exitosa
                } else {
                  console.error('❌ Error en sincronización desde botón:', results);
                }
              }}
              size="md"
              variant="success"
              className="flex items-center gap-2"
            >
              Sincronizar
            </SyncButton>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>



        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4 font-semibold text-gray-700">#</th>
                <th className="text-left p-4 font-semibold text-gray-700">Vehículo</th>
                <th className="text-left p-4 font-semibold text-gray-700">Placa</th>
                <th className="text-left p-4 font-semibold text-gray-700">Tipo</th>
                <th className="text-left p-4 font-semibold text-gray-700">Entrada</th>
                <th className="text-left p-4 font-semibold text-gray-700">Salida</th>
                <th className="text-left p-4 font-semibold text-gray-700">Tiempo</th>
                <th className="text-left p-4 font-semibold text-gray-700">Estado</th>
                <th className="text-left p-4 font-semibold text-gray-700">Cobro</th>
                <th className="text-left p-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle, index) => (
                <tr key={`vehicle-${vehicle.id || 'unknown'}-${index}-${vehicle.placa}`} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-800">{vehicle.id}</td>
                  <td className="p-4 text-gray-800">{vehicle.vehiculo}</td>
                  <td className="p-4 text-gray-800 font-mono font-bold">{vehicle.placa}</td>
                  <td className="p-4 text-gray-800">{vehicle.tipo}</td>
                  <td className="p-4 text-gray-800 text-sm">{vehicle.entrada}</td>
                  <td className="p-4 text-gray-800 text-sm">{vehicle.salida}</td>
                  <td className="p-4 text-gray-800 font-mono text-sm">{vehicle.tiempo}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vehicle.estado === 'Parqueado' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.estado}
                    </span>
                  </td>
                  <td className="p-4 text-gray-800 font-bold">
                    ${vehicle.cobro.toLocaleString('es-CO')}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {vehicle.barcode && (
                        <button
                          onClick={() => {
                            if (vehicle.ticketData) {
                              if (vehicle.estado === 'Parqueado') {
                                // Procesar salida con factura bonita
                                processExit(vehicle.ticketData);
                              } else {
                                // Reimprimir ticket de salida
                                smartPrint({
                                  type: 'exit',
                                  ticket: vehicle.ticketData,
                                  vehicleType: selectedVehicleType
                                });
                              }
                            }
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title={vehicle.estado === 'Parqueado' ? 'Procesar Salida y Cobrar' : 'Reimprimir Ticket'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver Detalles"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Escáner */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Escanear Código de Barras</h3>
              <button
                onClick={() => {
                  setShowScanner(false);
                  if (scannerRef.current) {
                    scannerRef.current.clear();
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div id="qr-scanner" className="mb-4"></div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {showPayment && scannedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Procesando Salida</h3>
              <div className="space-y-2 text-left mb-6">
                <div className="flex justify-between">
                  <span>Placa:</span>
                  <span className="font-bold">{scannedTicket.placa}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehículo:</span>
                  <span>{scannedTicket.vehicleType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiempo Total:</span>
                  <span className="font-mono">{scannedTicket.tiempoTotal}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-green-600">${scannedTicket.valorPagar?.toLocaleString('es-CO')}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (scannedTicket) {
                      try {
                        console.log('💰 Procesando pago del ticket:', scannedTicket.id, scannedTicket.placa);
                        
                        // 1. Marcar ticket como completado en la base de datos
                        const updatedTicket = await dualDatabase.completeParkingTicket(scannedTicket.id);
                        console.log('✅ Ticket completado en base de datos:', updatedTicket);
                        
                        // 2. Imprimir la factura
                        printExitTicket(scannedTicket);
                        
                        // 3. Recargar los datos para refrescar la lista
                        await loadParkingData();
                        
                        console.log('🔄 Datos recargados después del pago');
                      } catch (error) {
                        console.error('❌ Error procesando pago:', error);
                        alert(`Error procesando el pago: ${error}`);
                      }
                    }
                    setShowPayment(false);
                    setScannedTicket(null);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Confirmar Pago e Imprimir
                </button>
                <button
                  onClick={() => {
                    setShowPayment(false);
                    setScannedTicket(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas oculto para códigos de barras */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Notificación de impresión mejorada */}
      <AnimatePresence>
        {showPrintNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed bottom-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5 rounded-xl shadow-xl z-50 flex items-center gap-4 border border-green-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-200" />
              <Printer className="w-6 h-6 text-green-200" />
            </div>
            <div>
              <div className="font-bold text-lg">
                {isPrinterConnected || connectedPort ? 
                  'Ticket Térmico Generado ✅' : 
                  'Ticket Profesional Generado ✅'
                }
              </div>
              <div className="text-sm opacity-95 mt-1">
                {isPrinterConnected || connectedPort ? 
                  '🖨️ Enviado a impresora POS térmica' : 
                  '🖨️ Ticket optimizado para impresión'
                }
              </div>
              <div className="text-xs opacity-80 mt-1">
                📊 Formato: {isPrinterConnected || connectedPort ? 'Papel térmico 80mm' : 'Diseño moderno'} | 🕐 {new Date().toLocaleTimeString('es-CO')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para agregar tipo de vehículo */}
      <AddVehicleTypeModal
        isOpen={showAddVehicleTypeModal}
        onClose={() => setShowAddVehicleTypeModal(false)}
        onAdd={handleAddVehicleType}
        existingTypes={vehicleTypes}
      />
    </div>
  );
}