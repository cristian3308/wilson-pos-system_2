'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Car,
  Droplet,
  CalendarCheck,
  FileSpreadsheet,
  Printer,
  FileText
} from 'lucide-react';
import { getDualDB, ParkingTicket, CarwashTransaction, BusinessConfig } from '@/lib/dualDatabase';
import { getLocalDB } from '@/lib/localDatabase';
import { appEvents, APP_EVENTS } from '@/lib/eventEmitter';
import toast from 'react-hot-toast';
import ThermalBalanceReceipt from './ThermalBalanceReceipt';
import DateRangePicker, { DateRange as DateRangeFilter } from '@/components/DateRangePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/thermal-receipt.css';

type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'custom';

interface BalanceData {
  totalIncome: number;
  parkingIncome: number;
  carwashIncome: number;
  totalServices: number;
  parkingServices: number;
  carwashServices: number;
  workerCommissions: number;
  netIncome: number;
  dailyAverage: number;
  topWorker: { name: string; earnings: number } | null;
  comparisonPercentage: number;
}

const BalanceDashboard: React.FC = () => {
  const [balance, setBalance] = useState<BalanceData>({
    totalIncome: 0,
    parkingIncome: 0,
    carwashIncome: 0,
    totalServices: 0,
    parkingServices: 0,
    carwashServices: 0,
    workerCommissions: 0,
    netIncome: 0,
    dailyAverage: 0,
    topWorker: null,
    comparisonPercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('biweekly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Estados para el filtro de fecha con DateRangePicker
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    from: null,
    to: null,
    filter: 'all'
  });
  const [lastClosureDate, setLastClosureDate] = useState<Date | null>(null);

  // Cargar fecha del último cierre
  useEffect(() => {
    const localDBInstance = getLocalDB();
    const lastClosure = localDBInstance.getLastClosure();
    setLastClosureDate(lastClosure);
    
    if (lastClosure) {
      const hoursSinceLastClosure = (Date.now() - lastClosure.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastClosure < 24) {
        console.log(`📅 [BalanceDashboard] Último cierre hace ${Math.floor(hoursSinceLastClosure)} horas`);
      }
    }
  }, []);

  useEffect(() => {
    loadBalanceData();
  }, [selectedPeriod, startDate, endDate, dateRange]);

  // 🎧 Escuchar evento de cierre de caja completado
  useEffect(() => {
    const handleCashClosure = (data: { closureDate: Date }) => {
      console.log('📡 [BalanceDashboard] Cierre de caja detectado, aplicando filtro automático...');
      
      // Actualizar la fecha del último cierre
      setLastClosureDate(data.closureDate);
      
      // Aplicar automáticamente el filtro "Desde último cierre"
      setDateRange({
        from: data.closureDate,
        to: new Date(),
        filter: 'lastClosure'
      });
      
      console.log('✅ [BalanceDashboard] Filtro aplicado desde:', data.closureDate.toLocaleString('es-CO'));
    };

    appEvents.on(APP_EVENTS.CASH_CLOSURE_COMPLETED, handleCashClosure);

    return () => {
      appEvents.off(APP_EVENTS.CASH_CLOSURE_COMPLETED, handleCashClosure);
    };
  }, []);

  const calculateDateRange = (): { start: Date; end: Date; days: number } => {
    // Priorizar filtro de DateRangePicker si está activo
    if (dateRange.filter !== 'all' && dateRange.from && dateRange.to) {
      const start = new Date(dateRange.from);
      const end = new Date(dateRange.to);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return { start, end, days };
    }
    
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    if (selectedPeriod === 'custom' && startDate && endDate) {
      const customStart = new Date(startDate);
      const customEnd = new Date(endDate);
      const days = Math.max(1, Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24)));
      return { start: customStart, end: customEnd, days };
    }

    let days = 1;
    switch (selectedPeriod) {
      case 'weekly':
        start.setDate(now.getDate() - 7);
        days = 7;
        break;
      case 'biweekly':
        start.setDate(now.getDate() - 15);
        days = 15;
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        break;
    }

    return { start, end, days };
  };

  const loadBalanceData = async () => {
    try {
      setLoading(true);
      const dualDB = getDualDB();
      
      const { start, end, days } = calculateDateRange();

      // Cargar datos
      const [allParkingTickets, allCarwashTransactions, allWorkers, config] = await Promise.all([
        dualDB.getParkingTickets(),
        dualDB.getAllCarwashTransactions(),
        dualDB.getAllWorkers(true),
        dualDB.getBusinessConfig()
      ]);

      setBusinessConfig(config);

      // Filtrar por rango de fechas
      const parkingTickets = allParkingTickets.filter(t => {
        const ticketDate = new Date(t.entryTime);
        return ticketDate >= start && ticketDate <= end && t.status === 'completed';
      });

      const carwashTransactions = allCarwashTransactions.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= start && txDate <= end && t.status === 'completed';
      });

      // Calcular ingresos de parqueadero
      const parkingIncome = parkingTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

      // Calcular ingresos de lavadero (solo lo que gana la empresa)
      const carwashIncome = carwashTransactions.reduce((sum, t) => sum + t.companyEarning, 0);
      const workerCommissions = carwashTransactions.reduce((sum, t) => sum + t.workerCommission, 0);

      // Total de ingresos
      const totalIncome = parkingIncome + carwashIncome + workerCommissions;
      const netIncome = parkingIncome + carwashIncome; // Lo que le queda a la empresa

      // Servicios totales
      const parkingServices = parkingTickets.length;
      const carwashServices = carwashTransactions.length;
      const totalServices = parkingServices + carwashServices;

      // Promedio diario
      const dailyAverage = days > 0 ? totalIncome / days : 0;

      // Trabajador que más ganó
      const workerEarnings = new Map<string, { name: string; earnings: number }>();
      carwashTransactions.forEach(tx => {
        const current = workerEarnings.get(tx.workerId) || { name: tx.workerName, earnings: 0 };
        current.earnings += tx.workerCommission;
        workerEarnings.set(tx.workerId, current);
      });

      let topWorker = null;
      let maxEarnings = 0;
      workerEarnings.forEach(worker => {
        if (worker.earnings > maxEarnings) {
          maxEarnings = worker.earnings;
          topWorker = worker;
        }
      });

      // Calcular comparación con período anterior
      const prevStart = new Date(start);
      const prevEnd = new Date(end);
      prevStart.setDate(prevStart.getDate() - days);
      prevEnd.setDate(prevEnd.getDate() - days);

      const prevParkingTickets = allParkingTickets.filter(t => {
        const ticketDate = new Date(t.entryTime);
        return ticketDate >= prevStart && ticketDate <= prevEnd && t.status === 'completed';
      });

      const prevCarwashTransactions = allCarwashTransactions.filter(t => {
        const txDate = new Date(t.createdAt);
        return txDate >= prevStart && txDate <= prevEnd && t.status === 'completed';
      });

      const prevTotalIncome = 
        prevParkingTickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0) +
        prevCarwashTransactions.reduce((sum, t) => sum + t.companyEarning + t.workerCommission, 0);

      const comparisonPercentage = prevTotalIncome > 0 
        ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
        : 0;

      setBalance({
        totalIncome,
        parkingIncome,
        carwashIncome,
        totalServices,
        parkingServices,
        carwashServices,
        workerCommissions,
        netIncome,
        dailyAverage,
        topWorker,
        comparisonPercentage
      });
    } catch (error) {
      console.error('Error loading balance data:', error);
      toast.error('Error al cargar los datos de balance');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPeriodLabel = () => {
    const { start, end } = calculateDateRange();
    switch (selectedPeriod) {
      case 'weekly': return 'Última Semana';
      case 'biweekly': return 'Últimas 2 Semanas';
      case 'monthly': return 'Este Mes';
      case 'custom': 
        return `${start.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}`;
      default: return '';
    }
  };

  const exportToPDF = () => {
    const { start, end } = calculateDateRange();
    const doc = new jsPDF();
    
    // Configuración del documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Encabezado - Nombre de la empresa
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const companyName = businessConfig?.ticketData?.companyName || businessConfig?.businessName || 'WILSON CARS & WASH';
    doc.text(companyName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Dirección
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const address = businessConfig?.ticketData?.address || businessConfig?.businessAddress || 'Dirección del negocio';
    doc.text(address, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Línea separadora
    doc.setDrawColor(0, 150, 136);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Título del reporte
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text(`INFORME DE BALANCE - ${getPeriodLabel().toUpperCase()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Período
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const periodText = `Período: ${start.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    doc.text(periodText, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Resetear color del texto
    doc.setTextColor(0, 0, 0);

    // Tabla principal de ingresos
    const tableData = [
      ['🚗 Ingresos de Parqueadero', balance.parkingServices.toString() + ' servicios', formatCurrency(balance.parkingIncome)],
      ['🧼 Ingresos de Lavadero (Empresa)', balance.carwashServices.toString() + ' servicios', formatCurrency(balance.carwashIncome)],
      ['👨‍💼 Comisiones Trabajadores', '-', formatCurrency(balance.workerCommissions)]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Concepto', 'Cantidad', 'Monto']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 150, 136],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 50, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Tabla de totales
    const totalsData = [
      ['💰 TOTAL BRUTO', balance.totalServices.toString() + ' servicios', formatCurrency(balance.totalIncome)],
      ['✅ TOTAL NETO (Empresa)', '-', formatCurrency(balance.netIncome)],
      ['📊 Promedio Diario', '-', formatCurrency(balance.dailyAverage)]
    ];

    autoTable(doc, {
      startY: yPosition,
      body: totalsData,
      theme: 'plain',
      bodyStyles: {
        fontSize: 11,
        fontStyle: 'bold',
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: 'center' },
        2: { cellWidth: 50, halign: 'right', textColor: [0, 150, 136] }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Mejor trabajador (si existe)
    if (balance.topWorker) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 150, 136);
      doc.text('🏆 MEJOR TRABAJADOR DEL PERÍODO', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Nombre: ${balance.topWorker.name}`, 25, yPosition);
      yPosition += 6;
      doc.text(`Comisiones ganadas: ${formatCurrency(balance.topWorker.earnings)}`, 25, yPosition);
      yPosition += 12;
    }

    // Comparación con período anterior
    if (balance.comparisonPercentage !== 0) {
      const isPositive = balance.comparisonPercentage > 0;
      doc.setFontSize(10);
      doc.setTextColor(isPositive ? 34 : 220, isPositive ? 197 : 53, isPositive ? 94 : 69);
      const comparisonText = `${isPositive ? '📈' : '📉'} ${isPositive ? 'Aumento' : 'Disminución'} del ${Math.abs(balance.comparisonPercentage).toFixed(1)}% respecto al período anterior`;
      doc.text(comparisonText, 20, yPosition);
      yPosition += 15;
    }

    // Pie de página
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    const footerY = pageHeight - 15;
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, footerY, { align: 'center' });
    doc.text('Sistema POS - Wilson Cars & Wash', pageWidth / 2, footerY + 5, { align: 'center' });

    // Guardar PDF
    const fileName = `Informe_Balance_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('📄 Informe exportado a PDF exitosamente');
  };

  const printBalance = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
      toast.success('Imprimiendo recibo térmico...');
      setTimeout(() => setShowReceipt(false), 1000);
    }, 100);
  };

  return (
    <>
      {/* Recibo Térmico (solo visible al imprimir) */}
      {showReceipt && (
        <ThermalBalanceReceipt
          businessConfig={businessConfig || undefined}
          receiptData={{
            receiptNumber: `BAL${Date.now()}`,
            date: new Date(),
            period: getPeriodLabel(),
            totalIncome: balance.totalIncome,
            parkingIncome: balance.parkingIncome,
            carwashIncome: balance.carwashIncome,
            workerCommissions: balance.workerCommissions,
            netIncome: balance.netIncome,
            totalServices: balance.totalServices,
            parkingServices: balance.parkingServices,
            carwashServices: balance.carwashServices,
            dailyAverage: balance.dailyAverage,
            topWorker: balance.topWorker || undefined
          }}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 no-print">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-2xl">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Balance Financiero</h1>
                <p className="text-gray-300 text-lg">{getPeriodLabel()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-2 px-6 py-3 ${
                  dateRange.filter !== 'all'
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white rounded-xl transition-all shadow-lg hover:shadow-2xl hover:scale-105`}
              >
                <Calendar className="w-5 h-5" />
                {dateRange.filter !== 'all' ? 'Filtro Activo' : 'Filtrar por Fecha'}
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg hover:shadow-2xl hover:scale-105"
              >
                <FileText className="w-5 h-5" />
                Exportar PDF
              </button>
              <button
                onClick={printBalance}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-2xl hover:scale-105"
              >
                <Printer className="w-5 h-5" />
                Imprimir
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-8 border border-white/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Seleccionar Período</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value as PeriodType);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm"
              >
                <option value="weekly" className="bg-slate-800">Última Semana</option>
                <option value="biweekly" className="bg-slate-800">Últimas 2 Semanas</option>
                <option value="monthly" className="bg-slate-800">Este Mes</option>
                <option value="custom" className="bg-slate-800">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedPeriod('custom');
                }}
                disabled={selectedPeriod !== 'custom' && !startDate}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedPeriod('custom');
                }}
                disabled={selectedPeriod !== 'custom' && !endDate}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent backdrop-blur-sm disabled:opacity-50"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={loadBalanceData}
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-2xl"
              >
                Actualizar
              </button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Tarjeta Principal de Ingresos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-lg font-medium">Total de Ingresos</p>
                    <p className="text-white/60 text-sm">Bruto del período</p>
                  </div>
                  {balance.comparisonPercentage !== 0 && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                      balance.comparisonPercentage > 0 
                        ? 'bg-green-500/30 text-green-100' 
                        : 'bg-red-500/30 text-red-100'
                    }`}>
                      {balance.comparisonPercentage > 0 ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                      <span className="font-bold">
                        {Math.abs(balance.comparisonPercentage).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <h2 className="text-6xl font-bold text-white mb-6">
                  {formatCurrency(balance.totalIncome)}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-white/80 text-sm">Ingreso Neto (Empresa)</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(balance.netIncome)}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-white/80 text-sm">Promedio Diario</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(balance.dailyAverage)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tarjetas de Detalle */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-6 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Car className="w-10 h-10 opacity-80" />
                  <span className="text-3xl font-bold">{balance.parkingServices}</span>
                </div>
                <p className="text-white/80 mb-2">Parqueadero</p>
                <p className="text-2xl font-bold">{formatCurrency(balance.parkingIncome)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Droplet className="w-10 h-10 opacity-80" />
                  <span className="text-3xl font-bold">{balance.carwashServices}</span>
                </div>
                <p className="text-white/80 mb-2">Lavadero (Empresa)</p>
                <p className="text-2xl font-bold">{formatCurrency(balance.carwashIncome)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl p-6 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-10 h-10 opacity-80" />
                  <span className="text-3xl font-bold">{balance.carwashServices}</span>
                </div>
                <p className="text-white/80 mb-2">Comisiones</p>
                <p className="text-2xl font-bold">{formatCurrency(balance.workerCommissions)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl shadow-xl p-6 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-10 h-10 opacity-80" />
                  <span className="text-3xl font-bold">{balance.totalServices}</span>
                </div>
                <p className="text-white/80 mb-2">Total Servicios</p>
                <p className="text-2xl font-bold">Completados</p>
              </motion.div>
            </div>

            {/* Mejor Trabajador */}
            {balance.topWorker && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 text-lg mb-1">🏆 Trabajador Destacado del Período</p>
                    <p className="text-3xl font-bold text-white">{balance.topWorker.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300 text-sm">Total Ganado</p>
                    <p className="text-4xl font-bold text-yellow-400">
                      {formatCurrency(balance.topWorker.earnings)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        </div>

        {/* Modal de Filtros de Fecha */}
        <AnimatePresence>
          {showDateFilter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDateFilter(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Calendar className="w-8 h-8" />
                    Filtrar Balance por Fecha
                  </h2>
                  <button
                    onClick={() => setShowDateFilter(false)}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <DateRangePicker
                    onRangeChange={(range) => {
                      setDateRange(range);
                      console.log('📅 [BalanceDashboard] Filtro de fecha seleccionado:', range);
                      
                      // Auto-cerrar el modal si no es filtro personalizado o si ya se seleccionaron ambas fechas
                      if (range.filter !== 'custom' || (range.from && range.to)) {
                        setTimeout(() => setShowDateFilter(false), 300);
                        // Los datos se recargarán automáticamente por el useEffect que escucha dateRange
                      }
                    }}
                    lastClosureDate={lastClosureDate}
                    showQuickFilters={true}
                  />
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Nota:</strong> Los filtros de fecha afectan todos los cálculos del balance. 
                      Los datos históricos se mantienen guardados y no se eliminan.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default BalanceDashboard;
