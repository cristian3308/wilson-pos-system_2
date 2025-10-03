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
      <div className="receipt-header" style={{ marginBottom: '10mm' }}>
        <div className="receipt-title" style={{ fontSize: '32pt', marginBottom: '8mm', fontWeight: 'bold', lineHeight: '1.6' }}>
          TICKET PARQUEADERO
        </div>
        <div className="receipt-business-name" style={{ fontSize: '32pt', marginBottom: '8mm', fontWeight: 'bold', lineHeight: '1.6' }}>
          {businessConfig?.businessName || 'WILSON CARS & WASH'}
        </div>
        {businessConfig?.businessAddress && (
          <div className="receipt-subtitle" style={{ fontSize: '32pt', marginBottom: '6mm', lineHeight: '1.6' }}>{businessConfig.businessAddress}</div>
        )}
        {businessConfig?.businessPhone && (
          <div className="receipt-subtitle" style={{ fontSize: '32pt', marginBottom: '6mm', lineHeight: '1.6' }}>Tel: {businessConfig.businessPhone}</div>
        )}
      </div>

      {/* Ticket Info */}
      <div className="receipt-info" style={{ marginBottom: '10mm', marginTop: '10mm' }}>
        <div style={{ fontSize: '32pt', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span style={{ fontWeight: 'bold' }}>Ticket:</span>
          <span style={{ fontWeight: 'bold' }}>{ticket.id.slice(-8).toUpperCase()}</span>
        </div>
        <div style={{ fontSize: '32pt', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span style={{ fontWeight: 'bold' }}>Fecha:</span>
          <span style={{ fontWeight: 'bold' }}>{formatDate(ticket.entryTime)}</span>
        </div>
      </div>

      <div className="receipt-divider-double" style={{ margin: '8mm 0' }}></div>

      {/* Vehicle Info */}
      <div className="receipt-section" style={{ marginBottom: '12mm', marginTop: '12mm' }}>
        <div className="receipt-highlight">
          <div className="receipt-highlight-title" style={{ fontSize: '32pt', marginBottom: '6mm', fontWeight: 'bold' }}>
            {getVehicleTypeLabel()}
          </div>
          <div className="receipt-highlight-value" style={{ fontSize: '52pt', letterSpacing: '8px', padding: '8mm 0', fontWeight: 'bold' }}>
            {ticket.placa}
          </div>
        </div>
      </div>

      <div className="receipt-divider" style={{ margin: '8mm 0' }}></div>

      {/* Entry Details */}
      <div className="receipt-section" style={{ marginTop: '12mm', marginBottom: '12mm' }}>
        <div className="receipt-section-title" style={{ fontSize: '32pt', marginBottom: '8mm', fontWeight: 'bold', textAlign: 'center' }}>
          ENTRADA
        </div>
        <div style={{ fontSize: '32pt', marginBottom: '8mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span style={{ fontWeight: 'bold' }}>Hora:</span>
          <span style={{ fontWeight: 'bold' }}>{formatTime(ticket.entryTime)}</span>
        </div>
        
        {ticket.exitTime && (
          <>
            <div className="receipt-divider" style={{ margin: '10mm 0' }}></div>
            <div className="receipt-section-title" style={{ fontSize: '32pt', marginBottom: '8mm', fontWeight: 'bold', textAlign: 'center' }}>
              SALIDA
            </div>
            <div style={{ fontSize: '32pt', marginBottom: '8mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
              <span style={{ fontWeight: 'bold' }}>Hora:</span>
              <span style={{ fontWeight: 'bold' }}>{formatTime(ticket.exitTime)}</span>
            </div>
            <div style={{ fontSize: '32pt', marginBottom: '8mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
              <span style={{ fontWeight: 'bold' }}>Tiempo:</span>
              <span style={{ fontWeight: 'bold' }}>{calculateDuration()}</span>
            </div>
          </>
        )}
      </div>

      <div className="receipt-divider-double" style={{ margin: '10mm 0' }}></div>

      {/* Pricing */}
      <div className="receipt-totals" style={{ marginTop: '12mm', marginBottom: '12mm' }}>
        <div style={{ fontSize: '32pt', marginBottom: '8mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span style={{ fontWeight: 'bold' }}>Tarifa Base:</span>
          <span style={{ fontWeight: 'bold' }}>{formatCurrency(ticket.basePrice)}</span>
        </div>

        {ticket.totalAmount && ticket.totalAmount !== ticket.basePrice && (
          <div style={{ fontSize: '32pt', marginBottom: '8mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
            <span style={{ fontWeight: 'bold' }}>Tiempo Extra:</span>
            <span style={{ fontWeight: 'bold' }}>{formatCurrency(ticket.totalAmount - ticket.basePrice)}</span>
          </div>
        )}

        <div className="receipt-divider" style={{ margin: '8mm 0' }}></div>

        <div style={{ fontSize: '32pt', padding: '8mm 0', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.6' }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(ticket.totalAmount || ticket.basePrice)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="receipt-divider" style={{ margin: '10mm 0' }}></div>
      <div style={{ textAlign: 'center', margin: '12mm 0' }}>
        {ticket.status === 'completed' ? (
          <div style={{ 
            padding: '6mm', 
            background: 'white', 
            border: '5px solid black',
            fontWeight: 'bold',
            color: 'black',
            fontSize: '32pt',
            lineHeight: '1.5'
          }}>
            COMPLETADO
          </div>
        ) : (
          <div style={{ 
            padding: '6mm', 
            background: 'white', 
            border: '5px solid black',
            fontWeight: 'bold',
            color: 'black',
            fontSize: '32pt',
            lineHeight: '1.5'
          }}>
            EN CURSO
          </div>
        )}
      </div>

      <div className="receipt-divider-double" style={{ margin: '12mm 0' }}></div>

      {/* Barcode - Optimizado para escáner 1D Jaltech POS */}
      <div className="receipt-barcode" style={{ marginTop: '12mm', marginBottom: '12mm' }}>
        {/* Código numérico grande para lectura fácil */}
        <div style={{ 
          textAlign: 'center',
          fontSize: '40pt',
          fontWeight: 'bold',
          letterSpacing: '5px',
          fontFamily: 'monospace',
          marginBottom: '8mm',
          lineHeight: '1.5'
        }}>
          {generateTicketBarcode()}
        </div>
        
        {/* Representación visual del código de barras */}
        <div style={{ 
          height: '45mm', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '20pt',
          letterSpacing: '1px',
          fontFamily: 'Libre Barcode 128, monospace',
          fontWeight: 'normal',
          background: 'white',
          padding: '6mm 0',
          marginBottom: '8mm'
        }}>
          <div style={{ transform: 'scaleY(3)', letterSpacing: '0px' }}>
            * {generateTicketBarcode()} *
          </div>
        </div>
        
        {/* Número legible debajo */}
        <div className="receipt-barcode-text" style={{ 
          fontSize: '32pt', 
          marginTop: '8mm', 
          fontWeight: 'bold',
          letterSpacing: '4px',
          fontFamily: 'monospace'
        }}>
          {generateTicketBarcode()}
        </div>
      </div>

      {/* Footer */}
      <div className="receipt-footer" style={{ marginTop: '12mm', marginBottom: '10mm' }}>
        <div className="receipt-footer-message" style={{ fontSize: '32pt', marginBottom: '8mm', fontWeight: 'bold', lineHeight: '1.6' }}>
          GRACIAS POR PREFERIRNOS
        </div>
        <div className="receipt-footer-info" style={{ fontSize: '32pt', marginBottom: '8mm', lineHeight: '1.6' }}>
          Conserve este ticket para retirar su vehiculo
        </div>
        {!ticket.exitTime && (
          <div className="receipt-footer-info" style={{ marginTop: '8mm', fontWeight: 'bold', fontSize: '32pt', lineHeight: '1.6' }}>
            Presente este ticket al salir
          </div>
        )}
        <div style={{ marginTop: '10mm', fontSize: '32pt', color: 'black', fontWeight: 'bold' }}>
          {businessConfig?.ticketData?.website || 'www.wilsoncars.com'}
        </div>
      </div>
    </div>
  );
};

export default ThermalParkingTicket;
