'use client';

import React, { useState } from 'react';
import { CarwashTransaction } from '@/lib/localDatabase';
import { ArrowUpDown, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

interface CarwashReportTableProps {
  transactions: CarwashTransaction[];
}

type SortField = 'startTime' | 'placa' | 'serviceName' | 'basePrice' | 'workerName';
type SortDirection = 'asc' | 'desc';

const CarwashReportTable: React.FC<CarwashReportTableProps> = ({ transactions }) => {
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'startTime') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.basePrice * 1.19, 0);
  const totalCommissions = transactions.reduce((sum, transaction) => sum + transaction.workerCommission, 0);
  const totalCompanyEarning = transactions.reduce((sum, transaction) => sum + transaction.companyEarning, 0);

  const exportToPDF = () => {
    const doc = new jsPDF('landscape'); // Modo horizontal para más columnas
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text('REPORTE DE LAVADERO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Fecha del reporte
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Total de servicios: ${transactions.length}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setTextColor(0, 0, 0);

    // Preparar datos para la tabla
    const tableData = sortedTransactions.map(transaction => {
      const vehicleTypeMap: any = {
        'car': 'Carro',
        'motorcycle': 'Moto',
        'truck': 'Camión'
      };
      
      return [
        formatDate(transaction.startTime),
        formatTime(transaction.startTime),
        transaction.placa,
        transaction.serviceName,
        vehicleTypeMap[transaction.vehicleType] || transaction.vehicleType,
        transaction.workerName,
        formatCurrency(transaction.basePrice),
        formatCurrency(transaction.basePrice * 0.19),
        formatCurrency(transaction.basePrice * 1.19),
        formatCurrency(transaction.workerCommission),
        formatCurrency(transaction.companyEarning)
      ];
    });

    // Crear tabla
    autoTable(doc, {
      startY: yPosition,
      head: [['Fecha', 'Hora', 'Placa', 'Servicio', 'Tipo', 'Trabajador', 'Subtotal', 'IVA', 'Total', 'Comisión', 'Empresa']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 150, 136],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 20 },
        3: { cellWidth: 35 },
        4: { cellWidth: 18 },
        5: { cellWidth: 30 },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 22, halign: 'right' },
        9: { cellWidth: 22, halign: 'right' },
        10: { cellWidth: 22, halign: 'right' }
      },
      margin: { left: 10, right: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Resumen de totales
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    const summaryY = yPosition;
    const col1X = 15;
    const col2X = pageWidth / 2 + 10;
    
    doc.setTextColor(0, 150, 136);
    doc.text('TOTAL INGRESOS:', col1X, summaryY);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(totalRevenue), col1X + 50, summaryY);
    
    doc.setTextColor(0, 150, 136);
    doc.text('TOTAL COMISIONES:', col2X, summaryY);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(totalCommissions), col2X + 55, summaryY);
    
    doc.setTextColor(0, 150, 136);
    doc.text('GANANCIA EMPRESA:', col1X, summaryY + 8);
    doc.setTextColor(0, 150, 136);
    doc.setFontSize(13);
    doc.text(formatCurrency(totalCompanyEarning), col1X + 50, summaryY + 8);

    // Guardar PDF
    const fileName = `Reporte_Lavadero_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('📄 Reporte exportado a PDF exitosamente');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">🧼 Reporte de Lavadero</h3>
          <p className="text-slate-400">{transactions.length} servicios registrados</p>
        </div>
        <button
          onClick={exportToPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th 
                className="text-left py-4 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('startTime')}
              >
                <div className="flex items-center gap-2">
                  Fecha/Hora
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th 
                className="text-left py-4 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('placa')}
              >
                <div className="flex items-center gap-2">
                  Placa
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th 
                className="text-left py-4 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('serviceName')}
              >
                <div className="flex items-center gap-2">
                  Servicio
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th 
                className="text-left py-4 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('workerName')}
              >
                <div className="flex items-center gap-2">
                  Trabajador
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="text-center py-4 px-4 text-slate-300 font-semibold">
                Estado
              </th>
              <th 
                className="text-right py-4 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('basePrice')}
              >
                <div className="flex items-center justify-end gap-2">
                  Total
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="text-right py-4 px-4 text-slate-300 font-semibold">
                Comisión
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((transaction, index) => (
              <motion.tr
                key={transaction.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="text-white font-medium">{formatDate(transaction.startTime)}</div>
                  <div className="text-slate-400 text-sm">{formatTime(transaction.startTime)}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-white font-semibold text-lg">{transaction.placa}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="text-white font-medium">{transaction.serviceName}</div>
                  <div className="text-slate-400 text-sm">{transaction.vehicleType}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-slate-300">{transaction.workerName}</div>
                  <div className="text-slate-500 text-sm">{transaction.workerPercentage}% comisión</div>
                </td>
                <td className="py-4 px-4 text-center">
                  {transaction.status === 'completed' ? (
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                      Completado
                    </span>
                  ) : transaction.status === 'in_progress' ? (
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                      En Proceso
                    </span>
                  ) : transaction.status === 'pending' ? (
                    <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-sm font-medium">
                      Pendiente
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm font-medium">
                      Cancelado
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-white font-bold">
                    {formatCurrency(transaction.basePrice * 1.19)}
                  </div>
                  <div className="text-slate-400 text-sm">
                    + IVA
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-orange-400 font-semibold">
                    {formatCurrency(transaction.workerCommission)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-600">
              <td colSpan={5} className="py-4 px-4 text-right">
                <span className="text-white font-bold text-lg">TOTALES:</span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-green-400 font-bold text-xl">
                  {formatCurrency(totalRevenue)}
                </span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-orange-400 font-bold text-xl">
                  {formatCurrency(totalCommissions)}
                </span>
              </td>
            </tr>
            <tr className="border-t border-slate-700">
              <td colSpan={6} className="py-3 px-4 text-right">
                <span className="text-slate-300 text-sm">Ganancia Empresa:</span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-blue-400 font-semibold">
                  {formatCurrency(totalCompanyEarning)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No hay servicios en el período seleccionado</p>
        </div>
      )}
    </motion.div>
  );
};

export default CarwashReportTable;
