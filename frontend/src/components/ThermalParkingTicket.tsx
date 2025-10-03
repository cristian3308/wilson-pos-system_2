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
        <div className="receipt-title">TICKET PARQUEADERO</div>
        <div className="receipt-business-name">
          {businessConfig?.businessName || 'WILSON CARS & WASH'}
        </div>
        {businessConfig?.businessAddress && (
          <div className="receipt-subtitle">{businessConfig.businessAddress}</div>
        )}
        {businessConfig?.businessPhone && (
          <div className="receipt-subtitle">Tel: {businessConfig.businessPhone}</div>
        )}
      </div>

      {/* Ticket Info */}
      <div className="receipt-info">
        <div className="receipt-info-row">
          <span className="receipt-info-label">Ticket:</span>
          <span>{ticket.id.slice(-8).toUpperCase()}</span>
        </div>
        <div className="receipt-info-row">
          <span className="receipt-info-label">Fecha:</span>
          <span>{formatDate(ticket.entryTime)}</span>
        </div>
      </div>

      <div className="receipt-divider-double"></div>

      {/* Vehicle Info */}
      <div className="receipt-section">
        <div className="receipt-highlight">
          <div className="receipt-highlight-title">{getVehicleTypeLabel()}</div>
          <div className="receipt-highlight-value" style={{ fontSize: '24pt', letterSpacing: '3px' }}>
            {ticket.placa}
          </div>
        </div>
      </div>

      <div className="receipt-divider"></div>

      {/* Entry Details */}
      <div className="receipt-section">
        <div className="receipt-section-title">ENTRADA</div>
        <div className="receipt-item">
          <span className="receipt-item-name">Hora de Entrada:</span>
          <span className="receipt-item-value">{formatTime(ticket.entryTime)}</span>
        </div>
        
        {ticket.exitTime && (
          <>
            <div className="receipt-divider"></div>
            <div className="receipt-section-title">SALIDA</div>
            <div className="receipt-item">
              <span className="receipt-item-name">Hora de Salida:</span>
              <span className="receipt-item-value">{formatTime(ticket.exitTime)}</span>
            </div>
            <div className="receipt-item">
              <span className="receipt-item-name">Tiempo Total:</span>
              <span className="receipt-item-value">{calculateDuration()}</span>
            </div>
          </>
        )}
      </div>

      <div className="receipt-divider-double"></div>

      {/* Pricing */}
      <div className="receipt-totals">
        <div className="receipt-total-row">
          <span className="receipt-total-label">Tarifa Base:</span>
          <span className="receipt-total-value">{formatCurrency(ticket.basePrice)}</span>
        </div>

        {ticket.totalAmount && ticket.totalAmount !== ticket.basePrice && (
          <div className="receipt-total-row">
            <span className="receipt-total-label">Tiempo Adicional:</span>
            <span className="receipt-total-value">{formatCurrency(ticket.totalAmount - ticket.basePrice)}</span>
          </div>
        )}

        <div className="receipt-total-row grand-total">
          <span className="receipt-total-label">TOTAL A PAGAR:</span>
          <span className="receipt-total-value">{formatCurrency(ticket.totalAmount || ticket.basePrice)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="receipt-divider"></div>
      <div style={{ textAlign: 'center', margin: '3mm 0' }}>
        {ticket.status === 'completed' ? (
          <div style={{ 
            padding: '2mm', 
            background: 'white', 
            border: '2px solid black',
            fontWeight: 'bold',
            color: 'black'
          }}>
            COMPLETADO
          </div>
        ) : (
          <div style={{ 
            padding: '2mm', 
            background: 'white', 
            border: '2px solid black',
            fontWeight: 'bold',
            color: 'black'
          }}>
            EN CURSO
          </div>
        )}
      </div>

      <div className="receipt-divider-double"></div>

      {/* Barcode */}
      <div className="receipt-barcode">
        <div style={{ 
          height: '15mm', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '8pt',
          letterSpacing: '1px',
          fontFamily: 'monospace'
        }}>
          |||| || |||| || || |||| || ||||
        </div>
        <div className="receipt-barcode-text">{generateTicketBarcode()}</div>
      </div>

      {/* Footer */}
      <div className="receipt-footer">
        <div className="receipt-footer-message">
          GRACIAS POR PREFERIRNOS
        </div>
        <div className="receipt-footer-info">
          Conserve este ticket para retirar su vehiculo
        </div>
        {!ticket.exitTime && (
          <div className="receipt-footer-info" style={{ marginTop: '2mm', fontWeight: 'bold' }}>
            Presente este ticket al salir
          </div>
        )}
        <div style={{ marginTop: '3mm', fontSize: '7pt', color: 'black' }}>
          {businessConfig?.businessWebsite || 'www.wilsoncars.com'}
        </div>
      </div>
    </div>
  );
};

export default ThermalParkingTicket;
