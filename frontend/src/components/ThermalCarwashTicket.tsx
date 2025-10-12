'use client';

import React, { useEffect, useRef } from 'react';
import { CarwashTransaction, BusinessConfig } from '@/lib/localDatabase';
import JsBarcode from 'jsbarcode';

interface ThermalCarwashTicketProps {
  record: CarwashTransaction;
  businessConfig?: BusinessConfig;
}

const ThermalCarwashTicket: React.FC<ThermalCarwashTicketProps> = ({ record, businessConfig }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

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

  const getVehicleTypeLabel = () => {
    switch (record.vehicleType) {
      case 'car': return 'CARRO';
      case 'motorcycle': return 'MOTO';
      case 'truck': return 'CAMIÓN';
      default: return String(record.vehicleType).toUpperCase();
    }
  };

  const generateTicketBarcode = () => {
    return record.id.replace(/[^0-9]/g, '').slice(0, 15).padStart(15, '0');
  };

  const calculateIVA = () => {
    return record.basePrice * 0.19; // IVA 19%
  };

  const calculateTotal = () => {
    return record.basePrice + calculateIVA();
  };

  // Generar código de barras
  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, generateTicketBarcode(), {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [record.id]);

  return (
    <div id="thermal-receipt-carwash" className="thermal-receipt">
      {/* Header con Logo */}
      <div className="receipt-header" style={{ marginBottom: '10mm', textAlign: 'center' }}>
        <div className="receipt-business-name" style={{ fontSize: '36pt', marginBottom: '6mm', fontWeight: 'bold', lineHeight: '1.4' }}>
          {businessConfig?.businessName || 'WILSON CARS & WASH'}
        </div>
        <div className="receipt-subtitle" style={{ fontSize: '28pt', marginBottom: '4mm', lineHeight: '1.4', color: '#666' }}>
          Lavadero Professional
        </div>
        <div className="receipt-divider-thin" style={{ margin: '6mm 0', borderTop: '2px solid #000' }}></div>
        
        {businessConfig?.businessAddress && (
          <div className="receipt-subtitle" style={{ fontSize: '26pt', marginBottom: '3mm', lineHeight: '1.4' }}>
            📍 {businessConfig.businessAddress}
          </div>
        )}
        {businessConfig?.businessPhone && (
          <div className="receipt-subtitle" style={{ fontSize: '26pt', marginBottom: '6mm', lineHeight: '1.4' }}>
            📞 {businessConfig.businessPhone}
          </div>
        )}
      </div>

      <div className="receipt-divider-double" style={{ margin: '8mm 0', borderTop: '4px double #000' }}></div>

      {/* Título del Ticket */}
      <div style={{ textAlign: 'center', marginBottom: '10mm' }}>
        <div className="receipt-title" style={{ fontSize: '34pt', marginBottom: '6mm', fontWeight: 'bold', lineHeight: '1.6' }}>
          🧼 TICKET DE LAVADERO
        </div>
        <div style={{ fontSize: '28pt', marginBottom: '4mm', display: 'flex', justifyContent: 'center', alignItems: 'center', lineHeight: '1.6' }}>
          <span style={{ fontWeight: 'normal', marginRight: '8px' }}>Ticket #:</span>
          <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>L-{record.id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="receipt-divider-double" style={{ margin: '8mm 0', borderTop: '4px double #000' }}></div>

      {/* Información del Cliente y Vehículo */}
      <div className="receipt-section" style={{ marginBottom: '10mm' }}>
        <div style={{ fontSize: '30pt', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span>📅 Fecha:</span>
          <span style={{ fontWeight: 'bold' }}>{formatDate(record.startTime)}</span>
        </div>
        <div style={{ fontSize: '30pt', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span>🕐 Hora:</span>
          <span style={{ fontWeight: 'bold' }}>{formatTime(record.startTime)}</span>
        </div>
      </div>

      <div className="receipt-divider" style={{ margin: '8mm 0', borderTop: '2px dashed #000' }}></div>

      {/* Información del Vehículo */}
      <div className="receipt-section" style={{ marginBottom: '10mm' }}>
        <div style={{ fontSize: '30pt', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span>🚗 Tipo:</span>
          <span style={{ fontWeight: 'bold' }}>{getVehicleTypeLabel()}</span>
        </div>
        <div className="receipt-highlight" style={{ marginTop: '6mm' }}>
          <div style={{ fontSize: '28pt', marginBottom: '4mm', textAlign: 'center', color: '#666' }}>
            🅿️ Placa
          </div>
          <div className="receipt-highlight-value" style={{ fontSize: '48pt', letterSpacing: '6px', padding: '6mm 0', fontWeight: 'bold', textAlign: 'center' }}>
            {record.placa}
          </div>
        </div>
        {record.workerName && (
          <div style={{ fontSize: '30pt', marginTop: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
            <span>👨‍🔧 Trabajador:</span>
            <span style={{ fontWeight: 'bold' }}>{record.workerName}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider-double" style={{ margin: '8mm 0', borderTop: '4px double #000' }}></div>

      {/* Servicios */}
      <div className="receipt-section" style={{ marginBottom: '10mm' }}>
        <div className="receipt-section-title" style={{ fontSize: '32pt', marginBottom: '8mm', fontWeight: 'bold', textAlign: 'center', background: '#f0f0f0', padding: '4mm', borderRadius: '4mm' }}>
          🧼 SERVICIOS
        </div>
        
        <div style={{ marginTop: '8mm' }}>
          <div style={{ fontSize: '30pt', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', lineHeight: '1.6' }}>
            <span style={{ flex: 1, fontWeight: 'bold' }}>• {record.serviceName}</span>
            <span style={{ fontWeight: 'bold', marginLeft: '8mm' }}>{formatCurrency(record.basePrice)}</span>
          </div>
        </div>
      </div>

      <div className="receipt-divider" style={{ margin: '8mm 0', borderTop: '2px dashed #000' }}></div>

      {/* Totales */}
      <div className="receipt-totals" style={{ marginTop: '10mm', marginBottom: '10mm' }}>
        <div style={{ fontSize: '30pt', marginBottom: '6mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span>Subtotal:</span>
          <span style={{ fontWeight: 'bold' }}>{formatCurrency(record.basePrice)}</span>
        </div>
        <div style={{ fontSize: '30pt', marginBottom: '8mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.8' }}>
          <span>IVA (19%):</span>
          <span style={{ fontWeight: 'bold' }}>{formatCurrency(calculateIVA())}</span>
        </div>

        <div className="receipt-divider-double" style={{ margin: '8mm 0', borderTop: '4px double #000' }}></div>

        <div style={{ fontSize: '36pt', padding: '8mm', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f0f0', borderRadius: '4mm', lineHeight: '1.4' }}>
          <span>TOTAL A PAGAR:</span>
          <span>{formatCurrency(calculateTotal())}</span>
        </div>
      </div>

      {/* Información de Pago */}
      {record.status === 'completed' && (
        <>
          <div className="receipt-divider" style={{ margin: '8mm 0', borderTop: '2px dashed #000' }}></div>
          <div style={{ marginTop: '8mm', marginBottom: '8mm' }}>
            <div style={{ fontSize: '28pt', marginBottom: '4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: '1.6' }}>
              <span>Método de pago:</span>
              <span style={{ fontWeight: 'bold' }}>Efectivo</span>
            </div>
          </div>
        </>
      )}

      {/* Estado del Servicio */}
      <div className="receipt-divider-double" style={{ margin: '10mm 0', borderTop: '4px double #000' }}></div>
      <div style={{ textAlign: 'center', margin: '10mm 0' }}>
        {record.status === 'completed' ? (
          <div style={{ 
            padding: '6mm', 
            background: '#e8f5e9', 
            border: '4px solid #4caf50',
            borderRadius: '4mm',
            fontWeight: 'bold',
            color: '#2e7d32',
            fontSize: '32pt',
            lineHeight: '1.5'
          }}>
            ✅ SERVICIO COMPLETADO
          </div>
        ) : record.status === 'in_progress' ? (
          <div style={{ 
            padding: '6mm', 
            background: '#e3f2fd', 
            border: '4px solid #2196f3',
            borderRadius: '4mm',
            fontWeight: 'bold',
            color: '#1565c0',
            fontSize: '32pt',
            lineHeight: '1.5'
          }}>
            🔄 EN PROCESO
          </div>
        ) : (
          <div style={{ 
            padding: '6mm', 
            background: '#fff3e0', 
            border: '4px solid #ff9800',
            borderRadius: '4mm',
            fontWeight: 'bold',
            color: '#e65100',
            fontSize: '32pt',
            lineHeight: '1.5'
          }}>
            ⏳ PENDIENTE
          </div>
        )}
      </div>

      {/* Información de Comisiones (solo para uso interno) */}
      {record.workerCommission && record.companyEarning && (
        <>
          <div className="receipt-divider" style={{ margin: '8mm 0', borderTop: '2px dashed #000' }}></div>
          <div style={{ marginTop: '8mm', marginBottom: '8mm', fontSize: '24pt', color: '#666' }}>
            <div style={{ textAlign: 'center', marginBottom: '4mm', fontWeight: 'bold' }}>
              DISTRIBUCIÓN INTERNA
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3mm' }}>
              <span>Comisión Trabajador ({record.workerPercentage}%):</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(record.workerCommission)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ganancia Empresa:</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(record.companyEarning)}</span>
            </div>
          </div>
        </>
      )}

      <div className="receipt-divider-double" style={{ margin: '10mm 0', borderTop: '4px double #000' }}></div>

      {/* Código de Barras */}
      <div className="receipt-barcode" style={{ marginTop: '12mm', marginBottom: '12mm', textAlign: 'center' }}>
        <div style={{ padding: '8mm 0', background: 'white' }}>
          <svg ref={barcodeRef}></svg>
        </div>
        <div style={{ 
          fontSize: '24pt',
          marginTop: '6mm',
          letterSpacing: '3px',
          fontFamily: 'monospace',
          color: '#666'
        }}>
          *{record.placa}*L{record.id.slice(-6)}*
        </div>
      </div>

      <div className="receipt-divider-double" style={{ margin: '10mm 0', borderTop: '4px double #000' }}></div>

      {/* Footer */}
      <div className="receipt-footer" style={{ marginTop: '12mm', marginBottom: '10mm', textAlign: 'center' }}>
        <div className="receipt-footer-message" style={{ fontSize: '32pt', marginBottom: '8mm', fontWeight: 'bold', lineHeight: '1.6' }}>
          ¡GRACIAS POR CONFIAR EN NOSOTROS!
        </div>
        <div className="receipt-footer-info" style={{ fontSize: '28pt', marginBottom: '6mm', lineHeight: '1.6' }}>
          Vuelva pronto
        </div>
        <div style={{ marginTop: '8mm', fontSize: '26pt', color: '#666', lineHeight: '1.4' }}>
          {businessConfig?.ticketData?.website || 'www.wilsoncars.com'}
        </div>
        {businessConfig?.businessPhone && (
          <div style={{ marginTop: '4mm', fontSize: '26pt', color: '#666', lineHeight: '1.4' }}>
            📞 {businessConfig.businessPhone}
          </div>
        )}
        {businessConfig?.ticketData?.email && (
          <div style={{ marginTop: '4mm', fontSize: '26pt', color: '#666', lineHeight: '1.4' }}>
            📧 {businessConfig.ticketData.email}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThermalCarwashTicket;
