'use client';

import React from 'react';
import { ParkingTicket, BusinessConfig } from '@/lib/dualDatabase';

interface ThermalParkingTicketProps {
  ticket: ParkingTicket;
  businessConfig?: BusinessConfig;
}

const ThermalParkingTicket: React.FC<ThermalParkingTicketProps> = ({ ticket, businessConfig }) => {
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

  return (
    <div id="thermal-receipt" className="thermal-receipt">
      {/* Header */}
      <div className="receipt-header">
        <div className="receipt-title" style={{ fontSize: '26pt', marginBottom: '4mm', fontWeight: 'bold' }}>TICKET PARQUEADERO</div>
        <div className="receipt-business-name" style={{ fontSize: '28pt', marginBottom: '4mm', fontWeight: 'bold', lineHeight: '1.3' }}>
          {businessConfig?.businessName || 'WILSON CARS & WASH'}
        </div>
        {businessConfig?.businessAddress && (
          <div className="receipt-subtitle" style={{ fontSize: '16pt', marginBottom: '3mm' }}>{businessConfig.businessAddress}</div>
        )}
        {businessConfig?.businessPhone && (
          <div className="receipt-subtitle" style={{ fontSize: '16pt', marginBottom: '3mm' }}>Tel: {businessConfig.businessPhone}</div>
        )}
      </div>

      {/* Ticket Info */}
      <div className="receipt-info" style={{ marginBottom: '4mm', marginTop: '4mm' }}>
        <div className="receipt-info-row" style={{ fontSize: '18pt', marginBottom: '3mm' }}>
          <span className="receipt-info-label">Ticket:</span>
          <span style={{ fontWeight: 'bold' }}>{ticket.id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="receipt-info-row" style={{ fontSize: '18pt', marginBottom: '3mm' }}>
          <span className="receipt-info-label">Fecha:</span>
          <span style={{ fontWeight: 'bold' }}>{formatDate(ticket.entryTime)}</span>
        </div>
      </div>

      <div className="receipt-divider-double"></div>

      {/* Vehicle Info */}
      <div className="receipt-section" style={{ marginBottom: '5mm', marginTop: '5mm' }}>
        <div className="receipt-highlight">
          <div className="receipt-highlight-title" style={{ fontSize: '24pt', marginBottom: '3mm', fontWeight: 'bold' }}>{getVehicleTypeLabel()}</div>
          <div className="receipt-highlight-value" style={{ fontSize: '40pt', letterSpacing: '7px', padding: '4mm 0', fontWeight: 'bold' }}>
            {ticket.placa}
          </div>
        </div>
      </div>

      <div className="receipt-divider"></div>

      {/* Entry Details */}
      <div className="receipt-section" style={{ marginTop: '5mm', marginBottom: '5mm' }}>
        <div className="receipt-section-title" style={{ fontSize: '24pt', marginBottom: '3mm', fontWeight: 'bold' }}>ENTRADA</div>
        <div className="receipt-item" style={{ fontSize: '19pt', marginBottom: '3mm', lineHeight: '1.4' }}>
          <span className="receipt-item-name">Hora de Entrada:</span>
          <span className="receipt-item-value" style={{ fontWeight: 'bold' }}>{formatTime(ticket.entryTime)}</span>
        </div>
        
        {ticket.exitTime && (
          <>
            <div className="receipt-divider" style={{ margin: '4mm 0' }}></div>
            <div className="receipt-section-title" style={{ fontSize: '24pt', marginBottom: '3mm', fontWeight: 'bold' }}>SALIDA</div>
            <div className="receipt-item" style={{ fontSize: '19pt', marginBottom: '3mm', lineHeight: '1.4' }}>
              <span className="receipt-item-name">Hora de Salida:</span>
              <span className="receipt-item-value" style={{ fontWeight: 'bold' }}>{formatTime(ticket.exitTime)}</span>
            </div>
            <div className="receipt-item" style={{ fontSize: '19pt', marginBottom: '3mm', lineHeight: '1.4' }}>
              <span className="receipt-item-name">Tiempo Total:</span>
              <span className="receipt-item-value" style={{ fontWeight: 'bold' }}>{calculateDuration()}</span>
            </div>
          </>
        )}
      </div>

      <div className="receipt-divider-double"></div>

      {/* Pricing */}
      <div className="receipt-totals" style={{ marginTop: '5mm', marginBottom: '5mm' }}>
        <div className="receipt-total-row" style={{ fontSize: '19pt', marginBottom: '3mm', lineHeight: '1.4' }}>
          <span className="receipt-total-label">Tarifa Base:</span>
          <span className="receipt-total-value" style={{ fontWeight: 'bold' }}>{formatCurrency(ticket.basePrice)}</span>
        </div>

        {ticket.totalAmount && ticket.totalAmount !== ticket.basePrice && (
          <div className="receipt-total-row" style={{ fontSize: '19pt', marginBottom: '3mm', lineHeight: '1.4' }}>
            <span className="receipt-total-label">Tiempo Adicional:</span>
            <span className="receipt-total-value" style={{ fontWeight: 'bold' }}>{formatCurrency(ticket.totalAmount - ticket.basePrice)}</span>
          </div>
        )}

        <div className="receipt-total-row grand-total" style={{ fontSize: '28pt', padding: '4mm 0', fontWeight: 'bold', lineHeight: '1.3' }}>
          <span className="receipt-total-label">TOTAL A PAGAR:</span>
          <span className="receipt-total-value">{formatCurrency(ticket.totalAmount || ticket.basePrice)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="receipt-divider"></div>
      <div style={{ textAlign: 'center', margin: '5mm 0' }}>
        {ticket.status === 'completed' ? (
          <div style={{ 
            padding: '4mm', 
            background: 'white', 
            border: '4px solid black',
            fontWeight: 'bold',
            color: 'black',
            fontSize: '24pt'
          }}>
            COMPLETADO
          </div>
        ) : (
          <div style={{ 
            padding: '4mm', 
            background: 'white', 
            border: '4px solid black',
            fontWeight: 'bold',
            color: 'black',
            fontSize: '24pt'
          }}>
            EN CURSO
          </div>
        )}
      </div>

      <div className="receipt-divider-double"></div>

      {/* Barcode - Optimizado para escáner 1D Jaltech POS */}
      <div className="receipt-barcode" style={{ marginTop: '6mm', marginBottom: '6mm' }}>
        {/* Código numérico grande para lectura fácil */}
        <div style={{ 
          textAlign: 'center',
          fontSize: '32pt',
          fontWeight: 'bold',
          letterSpacing: '4px',
          fontFamily: 'monospace',
          marginBottom: '3mm',
          lineHeight: '1.2'
        }}>
          {generateTicketBarcode()}
        </div>
        
        {/* Representación visual del código de barras */}
        <div style={{ 
          height: '30mm', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '16pt',
          letterSpacing: '1px',
          fontFamily: 'Libre Barcode 128, monospace',
          fontWeight: 'normal',
          background: 'white',
          padding: '3mm 0'
        }}>
          <div style={{ transform: 'scaleY(2)', letterSpacing: '0px' }}>
            * {generateTicketBarcode()} *
          </div>
        </div>
        
        {/* Número legible debajo */}
        <div className="receipt-barcode-text" style={{ 
          fontSize: '18pt', 
          marginTop: '3mm', 
          fontWeight: 'bold',
          letterSpacing: '3px',
          fontFamily: 'monospace'
        }}>
          {generateTicketBarcode()}
        </div>
      </div>

      {/* Footer */}
      <div className="receipt-footer" style={{ marginTop: '5mm', marginBottom: '4mm' }}>
        <div className="receipt-footer-message" style={{ fontSize: '22pt', marginBottom: '4mm', fontWeight: 'bold', lineHeight: '1.3' }}>
          GRACIAS POR PREFERIRNOS
        </div>
        <div className="receipt-footer-info" style={{ fontSize: '17pt', marginBottom: '3mm', lineHeight: '1.5' }}>
          Conserve este ticket para retirar su vehiculo
        </div>
        {!ticket.exitTime && (
          <div className="receipt-footer-info" style={{ marginTop: '4mm', fontWeight: 'bold', fontSize: '18pt', lineHeight: '1.4' }}>
            Presente este ticket al salir
          </div>
        )}
        <div style={{ marginTop: '5mm', fontSize: '15pt', color: 'black', fontWeight: 'bold' }}>
          {businessConfig?.ticketData?.website || 'www.wilsoncars.com'}
        </div>
      </div>
    </div>
  );
};

export default ThermalParkingTicket;
