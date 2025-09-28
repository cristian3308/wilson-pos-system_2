import React from 'react';

interface TicketData {
  id: string;
  barcode: string;
  placa: string;
  vehicleType: string;
  fechaEntrada: Date;
  fechaSalida?: Date;
  tiempoTotal?: string;
  valorPagar?: number;
  estado: 'activo' | 'pagado';
}

interface VehicleType {
  name: string;
  tarifa: number;
}

interface PrintData {
  type: 'entry' | 'exit';
  ticket: TicketData;
  vehicleType?: VehicleType;
}

// Función específica para impresoras POS térmicas
export const printThermalTicket = (data: PrintData) => {
  const printWindow = window.open('', '_blank', 'width=300,height=500');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Wilson Cars & Wash - Ticket Térmico</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            width: 384px;
            margin: 0 auto;
            background: white;
            padding: 8px;
            font-size: 10px;
            line-height: 1.2;
        }
        
        .thermal-ticket {
            background: white;
            color: black;
            border: 1px solid #000;
            padding: 6px;
            max-width: 384px;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 8px;
            margin-bottom: 8px;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
        }
        
        .company-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
            color: #2c3e50;
        }
        
        .company-subtitle {
            font-size: 9px;
            margin-bottom: 2px;
            color: #34495e;
        }
        
        .nit {
            font-size: 8px;
            color: #5d6d7e;
        }
        
        .ticket-type {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin: 6px 0;
            border: 2px solid #3498db;
            padding: 4px;
            background: #e3f2fd;
            color: #1976d2;
            border-radius: 3px;
        }
        
        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 9px;
        }
        
        .label {
            font-weight: bold;
        }
        
        .value {
            text-align: right;
        }
        
        .separator {
            border-top: 1px dashed #000;
            margin: 6px 0;
        }
        
        .barcode-section {
            text-align: center;
            margin: 6px 0;
            border: 2px solid #3498db;
            padding: 6px;
            background: #f0f8ff;
            border-radius: 4px;
        }
        
        .barcode-title {
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 3px;
            color: #2c3e50;
        }
        
        .barcode-code {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            font-weight: bold;
            margin: 3px 0;
            letter-spacing: 1px;
            color: #1976d2;
        }
        
        .barcode-visual {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            margin: 3px 0;
            letter-spacing: 0px;
            line-height: 1;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .total-section {
            text-align: center;
            border: 2px solid #27ae60;
            padding: 6px;
            margin: 6px 0;
            background: #e8f5e8;
            border-radius: 4px;
        }
        
        .total-label {
            font-size: 10px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .total-amount {
            font-size: 16px;
            font-weight: bold;
            margin: 3px 0;
            color: #27ae60;
        }
        
        .footer {
            text-align: center;
            border-top: 1px dashed #000;
            padding-top: 6px;
            margin-top: 6px;
            font-size: 8px;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 4px;
        }
        
        .footer-info {
            line-height: 1.2;
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 0; 
                background: white;
                width: 384px;
            }
            .thermal-ticket { 
                border: none;
                box-shadow: none;
                max-width: 384px;
            }
            @page {
                size: 58mm auto;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="thermal-ticket">
        <div class="header">
            <div class="company-name">WILSON CARS & WASH</div>
            <div class="company-subtitle">PARKING PROFESSIONAL</div>
            <div class="nit">NIT: 19.475.534-7</div>
        </div>
        
        <div class="ticket-type">
            ${data.type === 'entry' ? 'TICKET DE ENTRADA' : 'FACTURA DE SALIDA'}
        </div>
        
        <div class="info-line">
            <span class="label">Placa:</span>
            <span class="value">${data.ticket.placa}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Vehiculo:</span>
            <span class="value">${data.ticket.vehicleType}</span>
        </div>
        
        ${data.type === 'entry' ? `
        <div class="info-line">
            <span class="label">Fecha:</span>
            <span class="value">${data.ticket.fechaEntrada.toLocaleDateString('es-CO')}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Hora:</span>
            <span class="value">${data.ticket.fechaEntrada.toLocaleTimeString('es-CO')}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Tarifa/Hora:</span>
            <span class="value">$${data.vehicleType?.tarifa?.toLocaleString('es-CO') || '0'}</span>
        </div>
        ` : `
        <div class="info-line">
            <span class="label">Entrada:</span>
            <span class="value">${data.ticket.fechaEntrada.toLocaleString('es-CO')}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Salida:</span>
            <span class="value">${data.ticket.fechaSalida?.toLocaleString('es-CO') || ''}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Tiempo:</span>
            <span class="value">${data.ticket.tiempoTotal || ''}</span>
        </div>
        `}
        
        <div class="separator"></div>
        
        ${data.type === 'entry' ? `
        <div class="barcode-section">
            <div class="barcode-title">CODIGO DE CONTROL</div>
            <div class="barcode-code">${data.ticket.barcode}</div>
            <div class="barcode-visual">
█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█<br>
█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█<br>
█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█
            </div>
        </div>
        ` : `
        <div class="total-section">
            <div class="total-label">TOTAL A PAGAR</div>
            <div class="total-amount">$${data.ticket.valorPagar?.toLocaleString('es-CO') || '0'}</div>
        </div>
        `}
        
        <div class="separator"></div>
        
        <div class="footer">
            <div class="footer-message">
                ${data.type === 'entry' ? 
                    'CONSERVE ESTE TICKET PARA LA SALIDA' : 
                    'GRACIAS POR SU VISITA'
                }
            </div>
            <div class="footer-info">
                Wilson Cars & Wash<br>
                Tel: +57 (1) 234-5678<br>
                www.wilsoncarwash.com<br>
                Atencion 24/7
            </div>
            <div class="separator"></div>
            <div style="font-size: 8px;">
                ${currentDate} ${currentTime}<br>
                Sistema POS v2.0 - ID: ${data.ticket.id?.substring(0, 8) || 'N/A'}
            </div>
        </div>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
                window.close();
            }, 500);
        }
    </script>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};

export const printModernTicket = (data: PrintData) => {
  const printWindow = window.open('', '_blank', 'width=450,height=700');
  if (printWindow) {
    const baseUrl = window.location.origin;
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Wilson Cars & Wash - ${data.type === 'entry' ? 'Ticket de Entrada' : 'Factura de Salida'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            width: 384px;
            margin: 10px auto;
            background: white;
            padding: 10px;
            font-size: 12px;
        }
        
        .ticket {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 2px solid #000;
            position: relative;
        }
        
        .ticket::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: #000;
        }
        
        .header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            color: #2c3e50;
            padding: 20px;
            text-align: center;
            position: relative;
            border: 2px solid #2c3e50;
            border-bottom: none;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 10px solid #2c3e50;
        }
        
        .logo {
            width: 80px;
            height: 60px;
            background: rgba(44, 62, 80, 0.1);
            border-radius: 8px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #2c3e50;
        }
        
        .logo img {
            max-width: 70px;
            max-height: 45px;
            border-radius: 4px;
        }
        
        .company-name {
            font-size: 22px;
            font-weight: 900;
            margin-bottom: 6px;
            color: #2c3e50;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            letter-spacing: 1.5px;
        }
        
        .company-subtitle {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 4px;
            font-weight: 600;
            letter-spacing: 0.8px;
            color: #34495e;
        }
        
        .nit {
            font-size: 11px;
            opacity: 0.8;
            font-weight: 500;
            color: #5d6d7e;
        }
        
        .ticket-type {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 16px;
            text-align: center;
            font-size: 16px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 0;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .content {
            padding: 20px;
            background: white;
        }
        
        .info-section {
            background: white;
            border-radius: 8px;
            padding: 18px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #000;
            position: relative;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #000;
            align-items: center;
        }
        
        .info-row:last-child {
            border-bottom: none;
            margin-top: 4px;
        }
        
        .label {
            font-weight: 600;
            color: #000;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .value {
            font-weight: 700;
            color: #000;
            font-size: 13px;
            text-align: right;
        }
        
        .highlight-value {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .barcode-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 16px 0;
            position: relative;
            overflow: hidden;
        }
        
        .barcode-title {
            font-size: 12px;
            color: #2c3e50;
            font-weight: 700;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            z-index: 1;
        }
        
        .barcode-code {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: 900;
            color: #2c3e50;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            margin: 8px 0;
            letter-spacing: 2px;
            border: 2px solid #3498db;
            position: relative;
            z-index: 1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .barcode-visual {
            font-family: 'Courier New', monospace;
            font-size: 28px;
            color: #2c3e50;
            margin: 12px 0;
            line-height: 1;
            position: relative;
            z-index: 1;
            background: white;
            padding: 16px 12px;
            border-radius: 6px;
            border: 2px solid #3498db;
            letter-spacing: 0px;
            font-weight: 900;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .total-section {
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            color: white;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 16px 0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        
        .total-label {
            font-size: 16px;
            margin-bottom: 8px;
            opacity: 0.95;
            font-weight: 600;
            position: relative;
            z-index: 1;
        }
        
        .total-amount {
            font-size: 32px;
            font-weight: 900;
            position: relative;
            z-index: 1;
            margin-bottom: 4px;
        }
        
        .footer {
            background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
            color: white;
            padding: 20px;
            text-align: center;
            position: relative;
        }
        
        .footer-message {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
            text-transform: uppercase;
            background: rgba(255,255,255,0.15);
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            position: relative;
            z-index: 1;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .footer-contact {
            font-size: 11px;
            opacity: 0.9;
            line-height: 1.6;
            position: relative;
            z-index: 1;
            margin-bottom: 12px;
        }
        
        .security-strip {
            height: 8px;
            background: linear-gradient(90deg, #3498db, #2980b9, #3498db);
            margin-top: 16px;
            border-radius: 4px;
            position: relative;
            z-index: 1;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .security-strip::after {
            content: 'SECURITY STRIP - TICKET VÁLIDO';
            position: absolute;
            top: -18px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 8px;
            color: rgba(255,255,255,0.6);
            letter-spacing: 1px;
        }
        
        @media print {
            body { margin: 0; padding: 8px; background: white; }
            .ticket { 
                box-shadow: none; 
                border: 1px solid #000; 
                page-break-inside: avoid;
            }
            .header, .ticket-type, .total-section, .footer {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="logo">
                <img src="${baseUrl}/images/company-logo.jpg" alt="Wilson Cars & Wash" 
                     onerror="this.parentElement.innerHTML='<div style=&quot;font-weight:bold;color:#2563eb;font-size:12px;&quot;>WILSON<br>CARS &amp; WASH</div>'" />
            </div>
            <div class="company-name">WILSON CARS & WASH</div>
            <div class="company-subtitle">PARKING PROFESSIONAL</div>
            <div class="nit">NIT: 19.475.534-7</div>
        </div>
        
        <div class="ticket-type">
            ${data.type === 'entry' ? 'Ticket de Entrada' : 'Factura de Salida'}
        </div>
        
        <div class="content">
            <div class="info-section">
                <div class="info-row">
                    <span class="label">Placa del Vehículo</span>
                    <span class="value highlight-value">${data.ticket.placa}</span>
                </div>
                <div class="info-row">
                    <span class="label">Tipo de Vehículo</span>
                    <span class="value">${data.ticket.vehicleType}</span>
                </div>
                ${data.type === 'entry' ? `
                <div class="info-row">
                    <span class="label">Fecha de Entrada</span>
                    <span class="value">${data.ticket.fechaEntrada.toLocaleDateString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Hora de Entrada</span>
                    <span class="value">${data.ticket.fechaEntrada.toLocaleTimeString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Tarifa por Hora</span>
                    <span class="value">$${data.vehicleType?.tarifa?.toLocaleString('es-CO') || '0'}</span>
                </div>
                <div class="info-row">
                    <span class="label">Hora Actual</span>
                    <span class="value">${currentTime}</span>
                </div>
                ` : `
                <div class="info-row">
                    <span class="label">Entrada</span>
                    <span class="value">${data.ticket.fechaEntrada.toLocaleString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Salida</span>
                    <span class="value">${data.ticket.fechaSalida?.toLocaleString('es-CO') || ''}</span>
                </div>
                <div class="info-row">
                    <span class="label">Tiempo Total</span>
                    <span class="value">${data.ticket.tiempoTotal || ''}</span>
                </div>
                `}
            </div>
            
            ${data.type === 'entry' ? `
            <div class="barcode-section">
                <div class="barcode-title">Código de Control de Entrada</div>
                <div class="barcode-code">${data.ticket.barcode}</div>
                <div class="barcode-visual">
█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█<br>
█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█<br>
█▌█▌█▌▌█▌▌█▌▌▌▌█▌▌▌█▌█▌█▌█▌▌█▌▌█▌█▌█▌▌█▌▌▌█▌▌█
                </div>
                <div style="font-size: 11px; color: #2c3e50; margin-top: 8px; font-weight: 600; position: relative; z-index: 1;">
                    Escanear este código para procesar la salida
                </div>
                <div style="font-size: 10px; color: #34495e; margin-top: 4px; position: relative; z-index: 1;">
                    Conserve este ticket - Requerido para salida
                </div>
            </div>
            ` : `
            <div class="total-section">
                <div class="total-label">Total a Pagar</div>
                <div class="total-amount">$${data.ticket.valorPagar?.toLocaleString('es-CO') || '0'}</div>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 8px;">
                    Pago realizado el ${currentDate} a las ${currentTime}
                </div>
            </div>
            `}
        </div>
        
        <div class="footer">
            <div class="footer-message">
                ${data.type === 'entry' ? 
                    'Conserve este ticket para la salida' : 
                    'Gracias por usar nuestros servicios'
                }
            </div>
            <div class="footer-contact">
                Wilson Cars & Wash - Parqueadero Profesional<br>
                NIT: 19.475.534-7 | www.wilsoncarwash.com<br>
                info@wilsoncarwash.com | +57 (1) 234-5678<br>
                Horario: 24/7 | Servicio completo de parqueadero
            </div>
            <div style="font-size: 9px; opacity: 0.8; margin-top: 8px; position: relative; z-index: 1; color: rgba(255,255,255,0.8);">
                Ticket generado el ${currentDate} a las ${currentTime}<br>
                Sistema POS Wilson v2.0 | ID: ${data.ticket.id?.substring(0, 8) || 'N/A'}
            </div>
            <div class="security-strip"></div>
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