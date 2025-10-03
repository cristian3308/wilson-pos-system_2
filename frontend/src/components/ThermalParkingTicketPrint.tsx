'use client';

import React from 'react';
import { ParkingTicket, BusinessConfig } from '@/lib/dualDatabase';

interface ThermalParkingTicketPrintProps {
  ticket: ParkingTicket;
  businessConfig?: BusinessConfig;
}

/**
 * Componente optimizado para impresión térmica 57mm
 * - Usa window.print() con estilos CSS optimizados
 * - Fuentes 32pt (tamaño del precio) en todo el ticket
 * - Espaciado extremo de 10-12mm entre secciones
 */
const ThermalParkingTicketPrint: React.FC<ThermalParkingTicketPrintProps> = ({ ticket, businessConfig }) => {
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
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateDuration = () => {
    if (!ticket.exitTime) return 'En parqueadero';
    const entry = new Date(ticket.entryTime);
    const exit = new Date(ticket.exitTime);
    const diff = exit.getTime() - entry.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getVehicleTypeLabel = () => {
    switch (ticket.vehicleType) {
      case 'car': return 'CARRO';
      case 'motorcycle': return 'MOTO';
      case 'truck': return 'CAMION';
      default: return String(ticket.vehicleType).toUpperCase();
    }
  };

  const generateTicketBarcode = () => {
    return ticket.id.replace(/[^0-9]/g, '').slice(0, 15).padStart(15, '0');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ticket Parqueadero - ${ticket.placa}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page {
            size: 57mm auto;
            margin: 0 3mm;
        }
        
        body {
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 32pt;
            background: white;
            color: #000;
            line-height: 1.6;
            width: 57mm;
            margin: 0 auto;
            padding: 3mm 5mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: #000;
        }
        
        .header {
            text-align: center;
            margin-bottom: 10mm;
        }
        
        .title {
            font-size: 32pt;
            font-weight: bold;
            margin-bottom: 8mm;
            line-height: 1.6;
        }
        
        .business-name {
            font-size: 32pt;
            font-weight: bold;
            margin-bottom: 8mm;
            line-height: 1.6;
        }
        
        .subtitle {
            font-size: 32pt;
            margin-bottom: 6mm;
            line-height: 1.6;
        }
        
        .info-section {
            margin-bottom: 10mm;
            margin-top: 10mm;
        }
        
        .info-line {
            font-size: 32pt;
            margin-bottom: 6mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            line-height: 1.8;
            font-weight: bold;
        }
        
        .divider {
            border-bottom: 2px solid #000;
            margin: 8mm 0;
        }
        
        .divider-double {
            border-bottom: 4px solid #000;
            margin: 12mm 0;
        }
        
        .vehicle-section {
            margin-bottom: 12mm;
            margin-top: 12mm;
            text-align: center;
        }
        
        .vehicle-type {
            font-size: 32pt;
            margin-bottom: 6mm;
            font-weight: bold;
        }
        
        .placa {
            font-size: 52pt;
            letter-spacing: 8px;
            padding: 8mm 0;
            font-weight: bold;
            border: 3px solid #000;
        }
        
        .entry-section {
            margin-top: 12mm;
            margin-bottom: 12mm;
        }
        
        .section-title {
            font-size: 32pt;
            margin-bottom: 8mm;
            font-weight: bold;
            text-align: center;
        }
        
        .pricing-section {
            margin-top: 12mm;
            margin-bottom: 12mm;
        }
        
        .total {
            font-size: 32pt;
            padding: 8mm 0;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            line-height: 1.6;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
        }
        
        .status {
            text-align: center;
            margin: 12mm 0;
        }
        
        .status-box {
            padding: 6mm;
            border: 5px solid #000;
            font-weight: bold;
            font-size: 32pt;
            line-height: 1.5;
        }
        
        .barcode-section {
            margin-top: 12mm;
            margin-bottom: 12mm;
            text-align: center;
        }
        
        .barcode-number-top {
            font-size: 40pt;
            font-weight: bold;
            letter-spacing: 5px;
            margin-bottom: 8mm;
            line-height: 1.5;
        }
        
        .barcode-visual {
            height: 45mm;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20pt;
            letter-spacing: 1px;
            font-weight: normal;
            padding: 6mm 0;
            margin-bottom: 8mm;
            font-family: 'Libre Barcode 128', monospace;
            transform: scaleY(3);
        }
        
        .barcode-number-bottom {
            font-size: 32pt;
            margin-top: 8mm;
            font-weight: bold;
            letter-spacing: 4px;
        }
        
        .footer {
            margin-top: 12mm;
            margin-bottom: 10mm;
            text-align: center;
        }
        
        .footer-message {
            font-size: 32pt;
            margin-bottom: 8mm;
            font-weight: bold;
            line-height: 1.6;
        }
        
        .footer-info {
            font-size: 32pt;
            margin-bottom: 8mm;
            line-height: 1.6;
        }
        
        .footer-website {
            margin-top: 10mm;
            font-size: 32pt;
            font-weight: bold;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- Header -->
        <div class="header">
            <div class="title">TICKET PARQUEADERO</div>
            <div class="business-name">${businessConfig?.businessName || 'WILSON CARS & WASH'}</div>
            ${businessConfig?.businessAddress ? `<div class="subtitle">${businessConfig.businessAddress}</div>` : ''}
            ${businessConfig?.businessPhone ? `<div class="subtitle">Tel: ${businessConfig.businessPhone}</div>` : ''}
        </div>

        <!-- Ticket Info -->
        <div class="info-section">
            <div class="info-line">
                <span>Ticket:</span>
                <span>${ticket.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-line">
                <span>Fecha:</span>
                <span>${formatDate(ticket.entryTime)}</span>
            </div>
        </div>

        <div class="divider-double"></div>

        <!-- Vehicle Info -->
        <div class="vehicle-section">
            <div class="vehicle-type">${getVehicleTypeLabel()}</div>
            <div class="placa">${ticket.placa}</div>
        </div>

        <div class="divider"></div>

        <!-- Entry Details -->
        <div class="entry-section">
            <div class="section-title">ENTRADA</div>
            <div class="info-line">
                <span>Hora:</span>
                <span>${formatTime(ticket.entryTime)}</span>
            </div>
            
            ${ticket.exitTime ? `
                <div class="divider" style="margin: 10mm 0;"></div>
                <div class="section-title">SALIDA</div>
                <div class="info-line">
                    <span>Hora:</span>
                    <span>${formatTime(ticket.exitTime)}</span>
                </div>
                <div class="info-line">
                    <span>Tiempo:</span>
                    <span>${calculateDuration()}</span>
                </div>
            ` : ''}
        </div>

        <div class="divider-double"></div>

        <!-- Pricing -->
        <div class="pricing-section">
            <div class="info-line">
                <span>Tarifa Base:</span>
                <span>${formatCurrency(ticket.basePrice)}</span>
            </div>

            ${ticket.totalAmount && ticket.totalAmount !== ticket.basePrice ? `
                <div class="info-line">
                    <span>Tiempo Extra:</span>
                    <span>${formatCurrency(ticket.totalAmount - ticket.basePrice)}</span>
                </div>
            ` : ''}

            <div class="divider" style="margin: 8mm 0;"></div>

            <div class="total">
                <span>TOTAL:</span>
                <span>${formatCurrency(ticket.totalAmount || ticket.basePrice)}</span>
            </div>
        </div>

        <!-- Status -->
        <div class="divider" style="margin: 10mm 0;"></div>
        <div class="status">
            <div class="status-box">
                ${ticket.status === 'completed' ? 'COMPLETADO' : 'EN CURSO'}
            </div>
        </div>

        <div class="divider-double"></div>

        <!-- Barcode -->
        <div class="barcode-section">
            <div class="barcode-number-top">${generateTicketBarcode()}</div>
            <div class="barcode-visual">* ${generateTicketBarcode()} *</div>
            <div class="barcode-number-bottom">${generateTicketBarcode()}</div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-message">GRACIAS POR PREFERIRNOS</div>
            <div class="footer-info">Conserve este ticket para retirar su vehiculo</div>
            ${!ticket.exitTime ? '<div class="footer-info" style="margin-top: 8mm; font-weight: bold;">Presente este ticket al salir</div>' : ''}
            <div class="footer-website">${businessConfig?.ticketData?.website || 'www.wilsoncars.com'}</div>
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

  return (
    <button
      onClick={handlePrint}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      🖨️ Imprimir Ticket Térmico
    </button>
  );
};

export default ThermalParkingTicketPrint;
