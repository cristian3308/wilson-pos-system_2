'use client';

import React from 'react';
import { BusinessConfig } from '@/lib/dualDatabase';

interface ThermalReceiptProps {
  businessConfig?: BusinessConfig;
  receiptData: {
    receiptNumber: string;
    date: Date;
    period: string;
    totalIncome: number;
    parkingIncome: number;
    carwashIncome: number;
    workerCommissions: number;
    netIncome: number;
    totalServices: number;
    parkingServices: number;
    carwashServices: number;
    dailyAverage: number;
    topWorker?: {
      name: string;
      earnings: number;
    };
  };
}

const ThermalBalanceReceipt: React.FC<ThermalReceiptProps> = ({ businessConfig, receiptData }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateBarcode = () => {
    // Generar un código de barras simple usando caracteres
    const code = receiptData.receiptNumber;
    return code.padStart(15, '0');
  };

  return (
    <div id="thermal-receipt" className="thermal-receipt">
      {/* Header */}
      <div className="receipt-header">
        <div className="receipt-title">BALANCE FINANCIERO</div>
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

      {/* Receipt Info */}
      <div className="receipt-info">
        <div className="receipt-info-row">
          <span className="receipt-info-label">Recibo:</span>
          <span>{receiptData.receiptNumber}</span>
        </div>
        <div className="receipt-info-row">
          <span className="receipt-info-label">Fecha:</span>
          <span>{formatDate(receiptData.date)}</span>
        </div>
        <div className="receipt-info-row">
          <span className="receipt-info-label">Período:</span>
          <span>{receiptData.period}</span>
        </div>
      </div>

      <div className="receipt-divider-double"></div>

      {/* Total Principal */}
      <div className="receipt-highlight">
        <div className="receipt-highlight-title">TOTAL INGRESOS BRUTOS</div>
        <div className="receipt-highlight-value">{formatCurrency(receiptData.totalIncome)}</div>
      </div>

      <div className="receipt-divider"></div>

      {/* Detalle de Ingresos */}
      <div className="receipt-section">
        <div className="receipt-section-title">DESGLOSE DE INGRESOS</div>
        
        <div className="receipt-item">
          <span className="receipt-item-name">Parqueadero ({receiptData.parkingServices})</span>
          <span className="receipt-item-value">{formatCurrency(receiptData.parkingIncome)}</span>
        </div>

        <div className="receipt-item">
          <span className="receipt-item-name">Lavadero ({receiptData.carwashServices})</span>
          <span className="receipt-item-value">{formatCurrency(receiptData.carwashIncome)}</span>
        </div>

        <div className="receipt-item">
          <span className="receipt-item-name">Comisiones Personal</span>
          <span className="receipt-item-value">{formatCurrency(receiptData.workerCommissions)}</span>
        </div>
      </div>

      <div className="receipt-divider"></div>

      {/* Totales */}
      <div className="receipt-totals">
        <div className="receipt-total-row">
          <span className="receipt-total-label">Total Servicios:</span>
          <span className="receipt-total-value">{receiptData.totalServices}</span>
        </div>

        <div className="receipt-total-row">
          <span className="receipt-total-label">Promedio Diario:</span>
          <span className="receipt-total-value">{formatCurrency(receiptData.dailyAverage)}</span>
        </div>

        <div className="receipt-total-row grand-total">
          <span className="receipt-total-label">INGRESO NETO:</span>
          <span className="receipt-total-value">{formatCurrency(receiptData.netIncome)}</span>
        </div>
      </div>

      {/* Mejor Trabajador */}
      {receiptData.topWorker && (
        <>
          <div className="receipt-divider"></div>
          <div className="receipt-section">
            <div className="receipt-section-title">🏆 TRABAJADOR DESTACADO</div>
            <div className="receipt-item">
              <span className="receipt-item-name">{receiptData.topWorker.name}</span>
              <span className="receipt-item-value">{formatCurrency(receiptData.topWorker.earnings)}</span>
            </div>
          </div>
        </>
      )}

      <div className="receipt-divider-double"></div>

      {/* Código de Barras Simulado */}
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
          ||||  ||  ||||  ||  ||  ||||  ||  ||||
        </div>
        <div className="receipt-barcode-text">{generateBarcode()}</div>
      </div>

      {/* Footer */}
      <div className="receipt-footer">
        <div className="receipt-footer-message">
          ¡GRACIAS POR SU CONFIANZA!
        </div>
        <div className="receipt-footer-info">
          Este documento es un reporte interno
        </div>
        <div className="receipt-footer-info">
          de balance financiero del período
        </div>
        <div className="receipt-footer-info">
          {receiptData.period}
        </div>
        <div style={{ marginTop: '3mm', fontSize: '8pt' }}>
          www.wilsoncars.com
        </div>
      </div>
    </div>
  );
};

export default ThermalBalanceReceipt;
