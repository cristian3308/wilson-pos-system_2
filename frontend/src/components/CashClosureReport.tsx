'use client';

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ParkingTicket, CarwashTransaction, VehicleTypeConfig } from '@/lib/localDatabase';
import localDB from '@/lib/localDatabase';
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface CashClosureData {
  businessName: string;
  date: Date;
  parkingTickets: ParkingTicket[];
  carwashTransactions: CarwashTransaction[];
  vehicleTypes: VehicleTypeConfig[];
}

interface CashClosureReportProps {
  data?: CashClosureData;
  onGenerate?: (doc: jsPDF) => void;
}

const CashClosureReport: React.FC<CashClosureReportProps> = ({ data: propData, onGenerate }) => {
  const [data, setData] = useState<CashClosureData | null>(propData || null);
  const [isLoading, setIsLoading] = useState(!propData);
  const [isSaving, setIsSaving] = useState(false);
  const [clearDataAfterClosure, setClearDataAfterClosure] = useState(true);

  useEffect(() => {
    if (!propData) {
      loadTodayData();
    }
  }, [propData]);

  const loadTodayData = async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // "2025-10-11"
      // ✅ NO modificar las horas - no es necesario para comparación de fechas

      // ✅ USAR LA MISMA FUENTE QUE EL DASHBOARD
      const [parkingHistory, carwashTransactions, config] = await Promise.all([
        localDB.getParkingHistory(), // ← CAMBIADO: usar historial en vez de tickets
        localDB.getAllCarwashTransactions(),
        localDB.getBusinessConfig()
      ]);

      console.log('📋 CIERRE - Total historial parqueadero:', parkingHistory.length);
      console.log('📋 CIERRE - Total transacciones lavadero:', carwashTransactions.length);
      console.log('📋 CIERRE - Fecha objetivo (hoy):', todayStr);
      
      // Mostrar todos los registros de parqueadero para debugging
      console.log('📋 CIERRE - Todos los registros de parqueadero:');
      parkingHistory.forEach((record, index) => {
        console.log(`   ${index + 1}. Placa: ${record.placa}, Estado: ${record.estado}, fechaSalida: ${record.fechaSalida}, fechaEntrada: ${record.fechaEntrada}, cobro: ${record.cobro}`);
      });

      // ✅ FILTRAR IGUAL QUE EL DASHBOARD (getDailyParkingRevenue)
      const todayParkingRecords = parkingHistory.filter(record => {
        // ✅ Extraer fecha usando la MISMA lógica que parkingSystem.ts
        const possibleFields = ['fechaSalida', 'salida', 'fechaEntrada', 'entrada', 'createdAt', 'timestamp'];
        let recordDate = '';
        
        for (const field of possibleFields) {
          const dateValue = (record as any)[field];
          if (dateValue && dateValue !== '-') {
            try {
              const date = new Date(dateValue);
              if (!isNaN(date.getTime())) {
                recordDate = date.toISOString().split('T')[0];
                break;
              }
            } catch {
              continue;
            }
          }
        }
        
        // Verificar estado completado
        const isCompleted = record.estado === 'Salió' || 
                           record.estado === 'Completado' || 
                           record.estado === 'salio' || 
                           record.estado === 'completado';
        
        const isToday = recordDate === todayStr;
        
        if (isCompleted) {
          console.log(`   🔍 Vehículo ${record.placa}: estado=${record.estado}, fecha=${recordDate}, hoy=${isToday}, cobro=$${record.cobro}`);
        }
        
        return isCompleted && isToday;
      });

      // Convertir formato de parkingHistory a formato de tickets para mantener compatibilidad
      const todayParking = todayParkingRecords.map(record => ({
        id: record.id || `history-${Date.now()}`,
        vehicleId: record.placa || '',
        vehicleType: record.vehiculo || record.tipoVehiculo || 'Carro',
        licensePlate: record.placa || '',
        placa: record.placa || '',
        entryTime: new Date(record.fechaEntrada || record.entrada || Date.now()),
        exitTime: new Date(record.fechaSalida || record.salida || Date.now()),
        totalAmount: record.cobro || 0,
        basePrice: record.cobro || 0,
        status: 'completed' as const,
        isPaid: true,
        duration: record.tiempoTotal || 0,
        createdAt: new Date(record.fechaEntrada || Date.now()),
        updatedAt: new Date(record.fechaSalida || Date.now())
      }));

      // ✅ FILTRAR SOLO TRANSACCIONES COMPLETADAS DE HOY
      const todayCarwash = carwashTransactions.filter(transaction => {
        // Verificar que sea completado
        const isCompleted = transaction.status === 'completed';
        if (!isCompleted) return false;
        
        // Verificar que sea de hoy
        const transDate = transaction.createdAt || transaction.startTime;
        if (!transDate) return false;
        
        const transDateStr = new Date(transDate).toISOString().split('T')[0];
        const isToday = transDateStr === todayStr;
        
        const precio = (transaction as any).totalPrice || transaction.basePrice || 0;
        console.log(`   Lavado ${transaction.id}: ${transaction.status}, fecha: ${transDateStr}, hoy: ${isToday}, precio: $${precio}`);
        return isToday;
      });

      console.log('📋 CIERRE - Tickets completados hoy:', todayParking.length);
      console.log('📋 CIERRE - Lavados completados hoy:', todayCarwash.length);

      setData({
        businessName: config?.businessName || 'Wilson Cars & Wash',
        date: new Date(),
        parkingTickets: todayParking,
        carwashTransactions: todayCarwash,
        vehicleTypes: config?.vehicleTypes || []
      });
    } catch (error) {
      console.error('Error loading cash closure data:', error);
      toast.error('Error al cargar los datos del cierre de caja');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Cargando datos del cierre...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No se pudieron cargar los datos</p>
        <button
          onClick={loadTodayData}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular resumen de parqueadero
  const calculateParkingSummary = () => {
    const summary: { [key: string]: { count: number; total: number; name: string } } = {};
    let totalParking = 0;

    data.parkingTickets.forEach(ticket => {
      if (ticket.status === 'completed' && ticket.totalAmount) {
        const typeId = ticket.vehicleType;
        
        if (!summary[typeId]) {
          const vehicleType = data.vehicleTypes.find(vt => vt.id === typeId);
          summary[typeId] = {
            count: 0,
            total: 0,
            name: vehicleType?.name || typeId
          };
        }
        
        summary[typeId].count++;
        summary[typeId].total += ticket.totalAmount;
        totalParking += ticket.totalAmount;
      }
    });

    return { summary, totalParking };
  };

  // Calcular resumen de lavadero
  const calculateCarwashSummary = () => {
    const summary: { [key: string]: { count: number; total: number } } = {};
    let totalCarwash = 0;
    let totalWorkerCommissions = 0;
    let totalCompanyEarning = 0;

    data.carwashTransactions.forEach(transaction => {
      if (transaction.status === 'completed') {
        const serviceName = transaction.serviceName;
        
        if (!summary[serviceName]) {
          summary[serviceName] = {
            count: 0,
            total: 0
          };
        }
        
        // ✅ USAR SOLO basePrice (sin IVA) para coincidir con Dashboard
        const price = transaction.basePrice || 0;
        summary[serviceName].count++;
        summary[serviceName].total += price;
        totalCarwash += price;
        totalWorkerCommissions += transaction.workerCommission;
        totalCompanyEarning += transaction.companyEarning;
      }
    });

    return { summary, totalCarwash, totalWorkerCommissions, totalCompanyEarning };
  };

  // Calcular comisiones por trabajador
  const calculateWorkerCommissions = () => {
    const commissions: { [key: string]: { name: string; services: number; commission: number } } = {};

    data.carwashTransactions.forEach(transaction => {
      if (transaction.status === 'completed') {
        const workerId = transaction.workerId;
        
        if (!commissions[workerId]) {
          commissions[workerId] = {
            name: transaction.workerName,
            services: 0,
            commission: 0
          };
        }
        
        commissions[workerId].services++;
        commissions[workerId].commission += transaction.workerCommission;
      }
    });

    return commissions;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 14;
    let currentY = 20;

    // Función para agregar nueva página si es necesario
    const checkPageBreak = (heightNeeded: number) => {
      if (currentY + heightNeeded > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    // ========================================
    // HEADER
    // ========================================
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(data.businessName || 'WILSON CARS & WASH', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.setFontSize(16);
    doc.text('CIERRE DE CAJA DETALLADO', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${formatDate(data.date)}`, marginLeft, currentY);
    doc.text(`Hora: ${formatTime(data.date)}`, pageWidth - marginLeft, currentY, { align: 'right' });
    
    currentY += 10;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
    currentY += 10;

    // ========================================
    // RESUMEN DE PARQUEADERO
    // ========================================
    const parkingSummary = calculateParkingSummary();
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PARQUEADERO - RESUMEN', marginLeft, currentY);
    currentY += 8;

    const parkingData: any[][] = [];
    Object.entries(parkingSummary.summary).forEach(([typeId, data]) => {
      parkingData.push([
        data.name,
        data.count.toString(),
        formatCurrency(data.total)
      ]);
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Tipo de Vehículo', 'Cantidad', 'Total']],
      body: parkingData,
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 60 }
      },
      margin: { left: marginLeft }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(marginLeft, currentY, pageWidth - 2 * marginLeft, 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PARQUEADERO:', marginLeft + 5, currentY + 7);
    doc.text(formatCurrency(parkingSummary.totalParking), pageWidth - marginLeft - 5, currentY + 7, { align: 'right' });
    currentY += 15;

    // ========================================
    // DETALLE COMPLETO DE PARQUEADERO
    // ========================================
    checkPageBreak(40);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PARQUEADERO - DETALLE COMPLETO DE VEHICULOS', marginLeft, currentY);
    currentY += 2;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de vehiculos procesados: ${data.parkingTickets.length}`, marginLeft, currentY + 5);
    currentY += 10;

    if (data.parkingTickets.length > 0) {
      const parkingDetailData: any[][] = data.parkingTickets.map((ticket, index) => {
        const entryDate = new Date(ticket.entryTime);
        const exitDate = ticket.exitTime ? new Date(ticket.exitTime) : new Date();
        const durationMs = exitDate.getTime() - entryDate.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const duration = `${hours}h ${minutes}m`;

        return [
          (index + 1).toString(),
          ticket.placa || (ticket as any).licensePlate || 'N/A',
          ticket.vehicleType || 'N/A',
          formatTime(entryDate),
          ticket.exitTime ? formatTime(exitDate) : '-',
          duration,
          formatCurrency(ticket.totalAmount || ticket.basePrice || 0)
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Placa', 'Tipo', 'Entrada', 'Salida', 'Tiempo', 'Monto']],
        body: parkingDetailData,
        theme: 'grid',
        headStyles: { 
          fillColor: [63, 81, 181], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 8
        },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 28 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 30, halign: 'right' }
        },
        margin: { left: marginLeft },
        didDrawPage: (hookData) => {
          currentY = hookData.cursor?.y || currentY;
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('No se registraron vehiculos en este periodo', marginLeft + 5, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 15;
    }

    // ========================================
    // RESUMEN DE LAVADERO
    // ========================================
    checkPageBreak(40);
    
    const carwashSummary = calculateCarwashSummary();
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAVADERO - RESUMEN', marginLeft, currentY);
    currentY += 8;

    const carwashData: any[][] = [];
    Object.entries(carwashSummary.summary).forEach(([serviceName, data]) => {
      carwashData.push([
        serviceName,
        data.count.toString(),
        formatCurrency(data.total)
      ]);
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Servicio', 'Cantidad', 'Total']],
      body: carwashData,
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 60 }
      },
      margin: { left: marginLeft }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(marginLeft, currentY, pageWidth - 2 * marginLeft, 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL LAVADERO:', marginLeft + 5, currentY + 7);
    doc.text(formatCurrency(carwashSummary.totalCarwash), pageWidth - marginLeft - 5, currentY + 7, { align: 'right' });
    currentY += 15;

    // ========================================
    // DETALLE COMPLETO DE LAVADERO
    // ========================================
    checkPageBreak(40);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAVADERO - DETALLE COMPLETO DE SERVICIOS', marginLeft, currentY);
    currentY += 2;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de servicios completados: ${data.carwashTransactions.length}`, marginLeft, currentY + 5);
    currentY += 10;

    if (data.carwashTransactions.length > 0) {
      const carwashDetailData: any[][] = data.carwashTransactions.map((transaction, index) => {
        const startDate = new Date(transaction.startTime);
        const endDate = transaction.endTime ? new Date(transaction.endTime) : new Date();
        const durationMs = endDate.getTime() - startDate.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        return [
          (index + 1).toString(),
          transaction.placa || 'N/A',
          transaction.serviceName || 'N/A',
          transaction.workerName || 'No asignado',
          formatTime(startDate),
          transaction.endTime ? formatTime(endDate) : '-',
          duration,
          formatCurrency(transaction.basePrice || 0),
          formatCurrency(transaction.workerCommission || 0)
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Placa', 'Servicio', 'Trabajador', 'Inicio', 'Fin', 'Tiempo', 'Precio', 'Comision']],
        body: carwashDetailData,
        theme: 'grid',
        headStyles: { 
          fillColor: [63, 81, 181], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 7
        },
        styles: { fontSize: 6, cellPadding: 1.5 },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 20 },
          2: { cellWidth: 28 },
          3: { cellWidth: 25 },
          4: { cellWidth: 16, halign: 'center', fontSize: 6 },
          5: { cellWidth: 16, halign: 'center', fontSize: 6 },
          6: { cellWidth: 14, halign: 'center' },
          7: { cellWidth: 22, halign: 'right' },
          8: { cellWidth: 22, halign: 'right' }
        },
        margin: { left: marginLeft },
        didDrawPage: (hookData) => {
          currentY = hookData.cursor?.y || currentY;
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('No se registraron servicios en este periodo', marginLeft + 5, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 15;
    }

    // ========================================
    // COMISIONES POR TRABAJADOR
    // ========================================
    checkPageBreak(40);
    
    const workerCommissions = calculateWorkerCommissions();
    const workerCount = Object.keys(workerCommissions).length;

    if (workerCount > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('COMISIONES DE TRABAJADORES', marginLeft, currentY);
      currentY += 8;

      const workerData: any[][] = [];
      Object.values(workerCommissions).forEach(worker => {
        workerData.push([
          worker.name,
          worker.services.toString(),
          formatCurrency(worker.commission)
        ]);
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Trabajador', 'Servicios', 'Comision']],
        body: workerData,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { halign: 'center', cellWidth: 40 },
          2: { halign: 'right', cellWidth: 60 }
        },
        margin: { left: marginLeft }
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;
      
      doc.setFillColor(255, 235, 235);
      doc.rect(marginLeft, currentY, pageWidth - 2 * marginLeft, 10, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL COMISIONES:', marginLeft + 5, currentY + 7);
      doc.text(formatCurrency(carwashSummary.totalWorkerCommissions), pageWidth - marginLeft - 5, currentY + 7, { align: 'right' });
      currentY += 15;
    }

    // ========================================
    // RESUMEN FINANCIERO TOTAL
    // ========================================
    checkPageBreak(50);
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
    currentY += 10;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN FINANCIERO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    const totalIngresos = parkingSummary.totalParking + carwashSummary.totalCarwash;
    const gananciaNeta = totalIngresos - carwashSummary.totalWorkerCommissions;

    // Tabla de resumen
    const summaryData = [
      ['Ingresos Parqueadero', formatCurrency(parkingSummary.totalParking)],
      ['Ingresos Lavadero', formatCurrency(carwashSummary.totalCarwash)],
      ['Total Ingresos Brutos', formatCurrency(totalIngresos)],
      ['(-) Comisiones Trabajadores', formatCurrency(carwashSummary.totalWorkerCommissions)],
      ['Ganancia Empresa (Lavadero)', formatCurrency(carwashSummary.totalCompanyEarning)]
    ];

    autoTable(doc, {
      startY: currentY,
      body: summaryData,
      theme: 'plain',
      styles: { 
        fontSize: 11, 
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: 'bold' },
        1: { halign: 'right', cellWidth: 60, fontStyle: 'bold' }
      },
      margin: { left: marginLeft }
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // GANANCIA NETA (destacada)
    doc.setFillColor(46, 125, 50);
    doc.rect(marginLeft, currentY, pageWidth - 2 * marginLeft, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GANANCIA NETA TOTAL:', marginLeft + 5, currentY + 10);
    doc.text(formatCurrency(gananciaNeta), pageWidth - marginLeft - 5, currentY + 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    currentY += 20;

    // ========================================
    // FOOTER
    // ========================================
    checkPageBreak(15);
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Reporte generado automáticamente por el Sistema POS', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text(`${formatDate(new Date())} - ${formatTime(new Date())}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text(`Total de páginas: ${doc.getNumberOfPages()}`, pageWidth / 2, currentY, { align: 'center' });

    // Callback para permitir guardar o mostrar el PDF
    if (onGenerate) {
      onGenerate(doc);
    }

    return doc;
  };

  const saveCashClosure = async () => {
    try {
      setIsSaving(true);
      
      const parkingSummaryData = calculateParkingSummary();
      const carwashSummaryData = calculateCarwashSummary();
      const commissionsData = calculateWorkerCommissions();

      const totalParkingRevenue = parkingSummaryData.totalParking;
      const totalCarwashRevenue = carwashSummaryData.totalCarwash;
      const totalCommissions = carwashSummaryData.totalWorkerCommissions;
      const totalRevenue = totalParkingRevenue + totalCarwashRevenue;
      const netProfit = totalRevenue - totalCommissions;

      // ✅ GUARDAR DETALLE COMPLETO DE PARQUEADERO (placa, fecha, hora, cobro)
      const parkingDetails = data.parkingTickets.map(ticket => {
        const entryDate = new Date(ticket.entryTime);
        const exitDate = ticket.exitTime ? new Date(ticket.exitTime) : new Date();
        const durationMs = exitDate.getTime() - entryDate.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          placa: ticket.placa || (ticket as any).licensePlate || 'N/A',
          vehiculo: ticket.vehicleType,
          fechaEntrada: ticket.entryTime,
          horaEntrada: entryDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          fechaSalida: ticket.exitTime || new Date(),
          horaSalida: exitDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          tiempoTotal: `${hours}h ${minutes}m`,
          cobro: ticket.totalAmount || ticket.basePrice,
          estado: 'Completado'
        };
      });

      // ✅ GUARDAR DETALLE COMPLETO DE LAVADERO (placa, servicios, fecha, hora, cobro, trabajador, comisión)
      const carwashDetails = data.carwashTransactions.map(transaction => {
        const startDate = new Date(transaction.startTime);
        const endDate = transaction.endTime ? new Date(transaction.endTime) : new Date();
        const durationMs = endDate.getTime() - startDate.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
          placa: transaction.placa || 'N/A',
          vehiculo: transaction.vehicleType,
          servicio: transaction.serviceName || 'N/A',
          trabajador: transaction.workerName || 'No asignado',
          horaInicio: startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          horaFin: endDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          tiempoTotal: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
          precio: transaction.basePrice || 0,
          comision: transaction.workerCommission || 0,
          estado: 'Completado'
        };
      });

      // Convertir summaries a arrays (resumen por tipo)
      const parkingArray = Object.values(parkingSummaryData.summary);
      const carwashArray = Object.values(carwashSummaryData.summary);
      const commissionsArray = Object.values(commissionsData);

      // Obtener el último cierre para usar su endDate como nuestro startDate
      let startDate = new Date().toISOString();
      try {
        const lastClosureResponse = await fetch('http://localhost:5000/api/v1/cash-closures/last');
        if (lastClosureResponse.ok) {
          const lastClosureData = await lastClosureResponse.json();
          if (lastClosureData.data) {
            startDate = lastClosureData.data.end_date;
          }
        }
      } catch (err) {
        console.warn('No se pudo obtener el último cierre, usando fecha actual');
      }
      
      const closureDate = new Date();
      const endDate = closureDate.toISOString();

      const closureData = {
        startDate,
        endDate,
        parkingRevenue: totalParkingRevenue,
        carwashRevenue: totalCarwashRevenue,
        totalRevenue,
        totalCommissions,
        netProfit,
        parkingData: parkingArray, // Resumen por tipo de vehículo
        carwashData: carwashArray, // Resumen por servicio
        parkingDetails, // ✅ DETALLE COMPLETO: Cada vehículo con placa, hora entrada, hora salida, tiempo, monto
        carwashDetails, // ✅ DETALLE COMPLETO: Cada servicio con placa, trabajador, hora inicio, hora fin, precio, comisión
        workerCommissions: commissionsArray,
        createdBy: 'sistema',
        notes: clearDataAfterClosure ? 'Datos limpiados después del cierre' : ''
      };

      console.log('💾 Guardando cierre con detalles completos:');
      console.log('   📋 Parqueadero - Total vehículos:', parkingDetails.length);
      console.log('   🚗 Lavadero - Total lavados:', carwashDetails.length);
      console.log('   📄 Resumen detalles parqueadero:', parkingDetails.slice(0, 2));
      console.log('   📄 Resumen detalles lavadero:', carwashDetails.slice(0, 2));

      const response = await fetch('http://localhost:5000/api/v1/cash-closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closureData)
      });

      if (!response.ok) throw new Error('Error al guardar el cierre');

      // ✅ GUARDAR FECHA DEL ÚLTIMO CIERRE EN LOCALSTORAGE
      localDB.saveLastClosure(closureDate);
      console.log('✅ Fecha de último cierre guardada:', closureDate.toLocaleString('es-CO'));

      // 📡 EMITIR EVENTO DE CIERRE COMPLETADO
      appEvents.emit(APP_EVENTS.CASH_CLOSURE_COMPLETED, { closureDate });
      console.log('📡 Evento de cierre de caja emitido');

      toast.success('Cierre de caja guardado exitosamente');

      // Limpiar datos si está marcado
      if (clearDataAfterClosure) {
        toast.success('Datos limpiados para el próximo período');
      }

      return true;
    } catch (error) {
      console.error('Error saving cash closure:', error);
      toast.error('Error al guardar el cierre de caja');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsSaving(true);
      
      // Guardar el cierre en la base de datos
      const saved = await saveCashClosure();
      
      if (saved) {
        // Generar y descargar el PDF
        const doc = generatePDF();
        const fileName = `Cierre_Caja_${data.date.toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success('PDF generado exitosamente');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Resumen del cierre */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Cierre</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Parqueadero</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(calculateParkingSummary().totalParking)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Lavadero</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(calculateCarwashSummary().totalCarwash)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Neto</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                calculateParkingSummary().totalParking +
                calculateCarwashSummary().totalCarwash -
                calculateCarwashSummary().totalWorkerCommissions
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Opción para limpiar datos */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={clearDataAfterClosure}
            onChange={(e) => setClearDataAfterClosure(e.target.checked)}
            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          />
          <div>
            <p className="font-medium text-gray-800">Limpiar datos después del cierre</p>
            <p className="text-sm text-gray-600">
              Los tickets y transacciones se archivarán y el sistema quedará listo para el próximo período
            </p>
          </div>
        </label>
      </div>

      {/* Botón de generar */}
      <button
        onClick={handleGeneratePDF}
        disabled={isSaving}
        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl 
                   hover:from-green-700 hover:to-green-800 transition-all duration-200 
                   shadow-lg hover:shadow-xl transform hover:scale-[1.02] 
                   font-semibold text-lg flex items-center justify-center gap-3
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Guardando y generando PDF...
          </>
        ) : (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" 
                clipRule="evenodd" 
              />
            </svg>
            Generar Cierre de Caja (PDF)
          </>
        )}
      </button>
    </div>
  );
};

export default CashClosureReport;
