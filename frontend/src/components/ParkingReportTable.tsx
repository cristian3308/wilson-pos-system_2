'use client';

import React, { useState } from 'react';
import { ParkingTicket } from '@/lib/localDatabase';
import { ArrowUpDown, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

interface ParkingReportTableProps {
  tickets: ParkingTicket[];
}

type SortField = 'entryTime' | 'placa' | 'vehicleType' | 'totalAmount';
type SortDirection = 'asc' | 'desc';

const ParkingReportTable: React.FC<ParkingReportTableProps> = ({ tickets }) => {
  const [sortField, setSortField] = useState<SortField>('entryTime');
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

  const sortedTickets = [...tickets].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'entryTime') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text('REPORTE DE PARQUEADERO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Fecha del reporte
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Total de tickets: ${tickets.length}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setTextColor(0, 0, 0);

    // Preparar datos para la tabla
    const tableData = sortedTickets.map(ticket => {
      const vehicleTypeMap: any = {
        'car': 'Carro',
        'motorcycle': 'Moto',
        'truck': 'Camión'
      };
      
      return [
        formatDate(ticket.entryTime),
        formatTime(ticket.entryTime),
        ticket.exitTime ? formatTime(ticket.exitTime) : '-',
        ticket.placa,
        vehicleTypeMap[ticket.vehicleType] || ticket.vehicleType,
        (ticket.totalMinutes || 0).toString(),
        ticket.status === 'completed' ? 'Completado' : 'Activo',
        formatCurrency(ticket.totalAmount || 0)
      ];
    });

    // Crear tabla
    autoTable(doc, {
      startY: yPosition,
      head: [['Fecha', 'Entrada', 'Salida', 'Placa', 'Tipo', 'Min', 'Estado', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 150, 136],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 25, halign: 'right' }
      },
      margin: { left: 10, right: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Total de ingresos
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 136);
    doc.text(`TOTAL INGRESOS: ${formatCurrency(totalRevenue)}`, pageWidth - 15, yPosition, { align: 'right' });

    // Guardar PDF
    const fileName = `Reporte_Parqueadero_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('📄 Reporte exportado a PDF exitosamente');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">🅿️ Reporte de Parqueadero</h3>
          <p className="text-slate-400">{tickets.length} tickets registrados</p>
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
                onClick={() => handleSort('entryTime')}
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
                onClick={() => handleSort('vehicleType')}
              >
                <div className="flex items-center gap-2">
                  Tipo
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="text-center py-4 px-4 text-slate-300 font-semibold">
                Minutos
              </th>
              <th className="text-center py-4 px-4 text-slate-300 font-semibold">
                Estado
              </th>
              <th 
                className="text-right py-4 px-4 text-slate-300 font-semibold cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center justify-end gap-2">
                  Total
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTickets.map((ticket, index) => (
              <motion.tr
                key={ticket.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="text-white font-medium">{formatDate(ticket.entryTime)}</div>
                  <div className="text-slate-400 text-sm">{formatTime(ticket.entryTime)}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-white font-semibold text-lg">{ticket.placa}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-slate-300">{ticket.vehicleType}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-slate-300">{ticket.totalMinutes || 0}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  {ticket.status === 'completed' ? (
                    <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                      Completado
                    </span>
                  ) : ticket.status === 'active' ? (
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                      Activo
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-sm font-medium">
                      Cancelado
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-white font-bold">
                    {formatCurrency(ticket.totalAmount || 0)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-600">
              <td colSpan={5} className="py-4 px-4 text-right">
                <span className="text-white font-bold text-lg">TOTAL:</span>
              </td>
              <td className="py-4 px-4 text-right">
                <span className="text-green-400 font-bold text-xl">
                  {formatCurrency(totalRevenue)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No hay tickets en el período seleccionado</p>
        </div>
      )}
    </motion.div>
  );
};

export default ParkingReportTable;
