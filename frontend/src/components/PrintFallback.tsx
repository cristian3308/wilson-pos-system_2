import React from 'react';
import { getDualDB } from '../lib/dualDatabase';

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
export const printThermalTicket = async (data: PrintData) => {
  // Obtener configuración desde la base de datos
  const dualDB = getDualDB();
  let config;
  try {
    config = await dualDB.getBusinessConfig();
  } catch (error) {
    console.error('Error cargando configuración:', error);
    config = null;
  }

  const ticketData = config?.ticketData || {
    companyName: 'WILSON CARS & WASH',
    companySubtitle: 'PARKING PROFESSIONAL',
    nit: '19.475.534-7',
    address: 'Calle 123 #45-67, Bogotá D.C.',
    phone: '+57 (1) 234-5678',
    email: 'info@wilsoncarwash.com',
    website: 'www.wilsoncarwash.com',
    footerMessage: '¡Gracias por confiar en nosotros!',
    footerInfo: 'Horario: 24/7 | Servicio completo de parqueadero'
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');
    
    // Cargar tipos de vehículos personalizados
    let vehicleTypeName: string = data.ticket.vehicleType;
    let vehicleTarifa: number = data.vehicleType?.tarifa || 0;
    
    console.log('🔍 DEBUG TICKET - Tipo de vehículo recibido:', data.ticket.vehicleType);
    console.log('🔍 DEBUG TICKET - Data completa:', data.ticket);
    
    try {
      const { getLocalDB } = await import('../lib/localDatabase');
      const localDB = getLocalDB();
      const customTypes = await localDB.getVehicleTypes();
      
      console.log('🔍 DEBUG TICKET - Tipos personalizados disponibles:', customTypes);
      
      // Buscar el tipo personalizado por ID
      const customType = customTypes.find((vt: any) => vt.id === data.ticket.vehicleType);
      if (customType) {
        vehicleTypeName = customType.name;
        vehicleTarifa = customType.tarifa;
        console.log('✅ Tipo de vehículo personalizado encontrado:', vehicleTypeName, '- Tarifa:', vehicleTarifa);
      } else {
        console.log('⚠️ No se encontró tipo personalizado, usando predeterminados');
        // Si no es personalizado, usar nombres predeterminados
        const defaultNames: Record<string, string> = {
          'car': 'Carro',
          'motorcycle': 'Moto',
          'truck': 'Camión'
        };
        vehicleTypeName = defaultNames[data.ticket.vehicleType] || data.ticket.vehicleType;
        console.log('📝 Nombre final:', vehicleTypeName);
      }
    } catch (error) {
      console.error('❌ Error cargando tipos de vehículos:', error);
    }
    
    // Generar representación visual del código de barras
    const generateBarcodeLines = (code: string) => {
      let pattern = '';
      for (let i = 0; i < code.length; i++) {
        const char = code.charCodeAt(i);
        const width = (char % 3) + 1;
        const isWide = char % 2 === 0;
        pattern += isWide ? '█'.repeat(width) + ' ' : '█ ';
      }
      return pattern;
    };
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${ticketData.companyName} - Ticket POS</title>
    <style>
        /* Configuración para impresoras POS térmicas 57mm (203DPI, ESC/POS) */
        @media print {
            @page {
                margin: 0;
                size: 57mm auto;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        body {
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 10px;
            background: white;
            color: black;
            line-height: 1.2;
            width: 57mm;
            margin: 0;
            padding: 2mm 3mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: black;
        }
        
        /* Header - Solo texto, sin backgrounds */
        .header {
            text-align: center;
            border-top: 2px solid black;
            border-bottom: 2px solid black;
            padding: 4px 0;
            margin-bottom: 6px;
        }
        
        .company-name {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 2px;
            letter-spacing: 0.5px;
        }
        
        .company-subtitle {
            font-size: 9px;
            margin-bottom: 2px;
        }
        
        .nit {
            font-size: 8px;
            margin-top: 2px;
        }
        
        /* Tipo de ticket - Solo borde y texto negro */
        .ticket-type {
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            margin: 6px 0;
            border: 2px solid black;
            padding: 4px;
            background: white;
            color: black;
            letter-spacing: 1px;
        }
        
        /* Líneas de información */
        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 9px;
            padding: 1px 0;
        }
        
        .label {
            font-weight: bold;
            color: black;
        }
        
        .value {
            text-align: right;
            color: black;
        }
        
        /* Separador - Línea punteada */
        .separator {
            border-top: 1px dashed black;
            margin: 4px 0;
        }
        
        /* Código de barras - Sin backgrounds */
        .barcode-section {
            text-align: center;
            margin: 6px 0;
            border: 1px solid black;
            padding: 4px;
            background: white;
        }
        
        .barcode-title {
            font-size: 7px;
            font-weight: bold;
            margin-bottom: 2px;
            color: black;
        }
        
        .barcode-visual {
            font-family: 'Courier New', monospace;
            font-size: 6px;
            margin: 3px 0;
            letter-spacing: 0px;
            line-height: 1;
            font-weight: bold;
            color: black;
            background: white;
            padding: 2px;
            word-break: break-all;
        }
        
        .barcode-code {
            font-family: 'Courier New', monospace;
            font-size: 8px;
            font-weight: bold;
            margin: 2px 0;
            letter-spacing: 1px;
            color: black;
        }
        
        /* Sección de total - Solo bordes negros */
        .total-section {
            text-align: center;
            border: 3px double black;
            padding: 6px;
            margin: 6px 0;
            background: white;
            color: black;
        }
        
        .total-label {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .total-amount {
            font-size: 16px;
            font-weight: bold;
            margin: 3px 0;
            letter-spacing: 1px;
        }
        
        /* Footer - Solo texto */
        .footer {
            text-align: center;
            font-size: 7px;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 4px 0;
            margin-top: 6px;
            line-height: 1.3;
            color: black;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 3px;
            font-size: 7px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .footer-info {
            margin: 2px 0;
            line-height: 1.3;
            opacity: 0.9;
        }
        
        .security-strip {
            height: 4px;
            background: linear-gradient(90deg, #3498db, #2980b9, #3498db);
            margin-top: 6px;
            border-radius: 2px;
            position: relative;
            z-index: 1;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .footer-message {
            font-weight: bold;
            font-size: 8px;
            margin-bottom: 3px;
        }
        
        .footer-info {
            font-size: 7px;
            line-height: 1.4;
        }
        
        /* Optimización para impresión térmica */
        @media print {
            body { 
                margin: 0; 
                padding: 0; 
                background: white;
                width: 57mm;
            }
            .ticket { 
                page-break-inside: avoid;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="company-name">${ticketData.companyName}</div>
            <div class="company-subtitle">${ticketData.companySubtitle}</div>
            <div class="nit">NIT: ${ticketData.nit}</div>
        </div>
        
        <div class="ticket-type">
            ${data.type === 'entry' ? '*** ENTRADA VEHICULO ***' : '*** SALIDA VEHICULO ***'}
        </div>
        
        <div class="info-line">
            <span class="label">Placa:</span>
            <span class="value">${data.ticket.placa}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Vehiculo:</span>
            <span class="value">__VEHICLE_TYPE_NAME__</span>
        </div>
        
        <div class="info-line">
            <span class="label">${data.type === 'entry' ? 'Entrada:' : 'Salida:'}</span>
            <span class="value">${(data.type === 'entry' ? data.ticket.fechaEntrada : data.ticket.fechaSalida)?.toLocaleString('es-CO')}</span>
        </div>
        
        ${data.type === 'exit' ? `
        <div class="info-line">
            <span class="label">Tiempo:</span>
            <span class="value">${data.ticket.tiempoTotal || 'N/A'}</span>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <div class="barcode-section">
            <div class="barcode-title">CODIGO DE BARRAS</div>
            <div class="barcode-visual">${generateBarcodeLines(data.ticket.barcode)}</div>
            <div class="barcode-code">${data.ticket.barcode}</div>
        </div>
        
        <div class="separator"></div>
        
        ${data.type === 'exit' ? `
        <div class="total-section">
            <div class="total-label">TOTAL A PAGAR</div>
            <div class="total-amount">$${data.ticket.valorPagar?.toLocaleString('es-CO') || '0'}</div>
            <div style="font-size: 7px; margin-top: 2px;">
                Pago: ${currentDate} ${currentTime}
            </div>
        </div>
        ` : `
        <div class="info-line">
            <span class="label">Tarifa/Hora:</span>
            <span class="value">__VEHICLE_TARIFA__</span>
        </div>
        `}
        
        <div class="separator"></div>
        
        <div class="footer">
            <div class="footer-message">
                ${data.type === 'entry' ? 
                    'CONSERVE ESTE TICKET' : 
                    'GRACIAS POR SU VISITA'
                }
            </div>
            <div class="separator" style="margin: 2px 0;"></div>
            <div class="footer-info">
                ${ticketData.address}<br>
                Tel: ${ticketData.phone}<br>
                ${ticketData.email}<br>
                ${ticketData.footerInfo}
            </div>
            <div style="font-size: 6px; margin-top: 3px;">
                ${currentDate} ${currentTime}<br>
                ID: ${data.ticket.id?.substring(0, 8) || 'N/A'}
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

    // Reemplazar los placeholders con los valores reales
    console.log('🎯 ANTES DEL REPLACE - vehicleTypeName:', vehicleTypeName);
    console.log('🎯 ANTES DEL REPLACE - vehicleTarifa:', vehicleTarifa);
    
    const finalHtml = htmlContent
      .replace('__VEHICLE_TYPE_NAME__', vehicleTypeName)
      .replace('__VEHICLE_TARIFA__', `$${vehicleTarifa?.toLocaleString('es-CO') || '0'}`);

    console.log('✅ HTML después del replace (primeros 2000 chars):', finalHtml.substring(0, 2000));
    
    printWindow.document.write(finalHtml);
    printWindow.document.close();
  }
};

export const printModernTicket = async (data: PrintData) => {
  // Obtener configuración desde la base de datos
  const dualDB = getDualDB();
  let config;
  try {
    config = await dualDB.getBusinessConfig();
  } catch (error) {
    console.error('Error cargando configuración:', error);
    config = null;
  }

  const ticketData = config?.ticketData || {
    companyName: 'WILSON CARS & WASH',
    companySubtitle: 'PARKING PROFESSIONAL',
    nit: '19.475.534-7',
    address: 'Calle 123 #45-67, Bogotá D.C.',
    phone: '+57 (1) 234-5678',
    email: 'info@wilsoncarwash.com',
    website: 'www.wilsoncarwash.com',
    footerMessage: '¡Gracias por confiar en nosotros!',
    footerInfo: 'Horario: 24/7 | Servicio completo de parqueadero'
  };
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
    <title>${ticketData.companyName} - ${data.type === 'entry' ? 'Ticket de Entrada' : 'Factura de Salida'}</title>
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
                <img src="${baseUrl}/images/company-logo.jpg" alt="${ticketData.companyName}" 
                     onerror="this.parentElement.innerHTML='<div style=&quot;font-weight:bold;color:#2563eb;font-size:12px;&quot;>${ticketData.companyName.split(' ').join('<br>')}</div>'" />
            </div>
            <div class="company-name">${ticketData.companyName}</div>
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
                    <span class="value">__VEHICLE_TYPE_NAME__</span>
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
                    <span class="value">__VEHICLE_TARIFA__</span>
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
▌█▌▌█▌█▌▌▌█▌█▌▌█▌▌█▌█▌▌█▌█▌▌▌█▌▌█▌█▌▌█▌█▌▌▌█▌█▌▌█▌▌█▌█▌▌█▌<br>
▌█▌▌█▌█▌▌▌█▌█▌▌█▌▌█▌█▌▌█▌█▌▌▌█▌▌█▌█▌▌█▌█▌▌▌█▌█▌▌█▌▌█▌█▌▌█▌
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

// Función para imprimir tickets de lavadero
interface CarwashTicketData {
  id: string;
  ticketId: string;
  placa: string;
  vehicleType: string;
  serviceName: string;
  basePrice: number;
  workerName: string;
  workerPercentage: number;
  workerCommission: number;
  companyEarning: number;
  status: string;
  startTime: Date;
  estimatedTime?: number;
}

export const printCarwashTicket = async (transaction: CarwashTicketData) => {
  // Obtener configuración desde la base de datos
  const dualDB = getDualDB();
  let config;
  try {
    config = await dualDB.getBusinessConfig();
  } catch (error) {
    console.error('Error cargando configuración:', error);
    config = null;
  }

  const ticketData = config?.ticketData || {
    companyName: 'WILSON CARS & WASH',
    companySubtitle: 'SERVICIOS DE LAVADO PROFESIONAL',
    nit: '19.475.534-7',
    address: 'Calle 123 #45-67, Bogotá D.C.',
    phone: '+57 (1) 234-5678',
    email: 'info@wilsoncarwash.com',
    website: 'www.wilsoncarwash.com',
    footerMessage: '¡Gracias por confiar en nosotros!',
    footerInfo: 'Horario: 24/7 | Lavado profesional de vehículos'
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');
    const startDate = new Date(transaction.startTime).toLocaleDateString('es-CO');
    const startTime = new Date(transaction.startTime).toLocaleTimeString('es-CO');
    
    // Obtener emoji del vehículo
    const getVehicleEmoji = (type: string) => {
      const emojis: Record<string, string> = {
        'car': '🚗',
        'motorcycle': '🏍️',
        'truck': '🚛',
        'carro': '🚗',
        'moto': '🏍️',
        'camioneta': '🚙',
        'buseta': '🚐'
      };
      return emojis[type.toLowerCase()] || '🚗';
    };

    // Generar representación visual del código de barras
    const generateBarcodeLines = (code: string) => {
      let pattern = '';
      for (let i = 0; i < code.length; i++) {
        const char = code.charCodeAt(i);
        const width = (char % 3) + 1;
        const isWide = char % 2 === 0;
        pattern += isWide ? '█'.repeat(width) + ' ' : '█ ';
      }
      return pattern;
    };
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${ticketData.companyName} - Orden de Lavado</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 9px;
            background: white;
            color: #2c3e50;
            line-height: 1.3;
            width: 76mm;
            margin: 0 auto;
            padding: 2mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: #2c3e50;
            border: 2px solid #9b59b6;
            border-radius: 4px;
            padding: 8px;
            position: relative;
        }
        
        .header {
            text-align: center;
            background: linear-gradient(135deg, #9b59b6, #8e44ad);
            color: white;
            padding: 6px;
            border-radius: 4px;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
            box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
        }
        
        .company-name {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 2px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .company-subtitle {
            font-size: 8px;
            margin-bottom: 1px;
            opacity: 0.9;
        }
        
        .nit {
            font-size: 7px;
            opacity: 0.8;
        }
        
        .ticket-type {
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            margin: 6px 0;
            border: 2px solid #e67e22;
            padding: 4px;
            background: linear-gradient(135deg, #f39c12, #e67e22);
            color: white;
            border-radius: 4px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 8px;
            padding: 1px 0;
            position: relative;
            z-index: 1;
        }
        
        .label {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .value {
            text-align: right;
            color: #34495e;
        }
        
        .separator {
            border-top: 1px dashed #bdc3c7;
            margin: 6px 0;
            position: relative;
            z-index: 1;
        }
        
        .barcode-section {
            text-align: center;
            margin: 6px 0;
            border: 2px solid #3498db;
            padding: 4px;
            background: linear-gradient(135deg, #ffffff, #f8f9fa);
            border-radius: 4px;
            position: relative;
            z-index: 1;
            box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
            width: 100%;
            max-width: 100%;
        }
        
        .barcode-title {
            font-size: 6px;
            font-weight: bold;
            margin-bottom: 3px;
            color: #3498db;
            text-transform: uppercase;
        }
        
        .barcode-visual {
            font-family: 'Courier New', monospace;
            font-size: 5px;
            margin: 3px 0;
            letter-spacing: 0px;
            line-height: 1;
            font-weight: bold;
            color: #2c3e50;
            background: white;
            padding: 3px;
            border: 1px solid #e0e0e0;
            border-radius: 2px;
            word-break: break-all;
            max-width: 100%;
            overflow: hidden;
        }
        
        .barcode-code {
            font-family: 'Courier New', monospace;
            font-size: 6px;
            font-weight: bold;
            margin: 3px 0;
            letter-spacing: 0.5px;
            color: #34495e;
            word-break: break-all;
        }
        
        .service-section {
            text-align: center;
            border: 2px solid #16a085;
            padding: 6px;
            margin: 6px 0;
            background: linear-gradient(135deg, #1abc9c, #16a085);
            border-radius: 4px;
            color: white;
            position: relative;
            z-index: 1;
            box-shadow: 0 2px 10px rgba(22, 160, 133, 0.3);
        }
        
        .service-name {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 2px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .service-price {
            font-size: 14px;
            font-weight: bold;
            margin: 3px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .commission-section {
            background: #ecf0f1;
            padding: 4px;
            margin: 6px 0;
            border-radius: 4px;
            border: 1px solid #bdc3c7;
        }
        
        .commission-title {
            font-size: 7px;
            font-weight: bold;
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 3px;
        }
        
        .footer {
            text-align: center;
            font-size: 6px;
            background: linear-gradient(135deg, #636e72, #2d3436);
            color: white;
            padding: 4px;
            border-radius: 4px;
            margin-top: 6px;
            position: relative;
            z-index: 1;
            line-height: 1.2;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 3px;
            font-size: 7px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .footer-info {
            margin: 2px 0;
            line-height: 1.3;
            opacity: 0.9;
        }
        
        .security-strip {
            height: 4px;
            background: linear-gradient(90deg, #9b59b6, #8e44ad, #9b59b6);
            margin-top: 6px;
            border-radius: 2px;
            position: relative;
            z-index: 1;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        @media print {
            body { 
                margin: 0; 
                padding: 1mm; 
                background: white;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                width: 80mm;
            }
            .ticket { 
                border: 1px solid #9b59b6;
                page-break-inside: avoid;
                box-shadow: none;
            }
            .header, .ticket-type, .service-section, .footer {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="company-name">${ticketData.companyName}</div>
            <div class="company-subtitle">${ticketData.companySubtitle}</div>
            <div class="nit">NIT: ${ticketData.nit}</div>
        </div>
        
        <div class="ticket-type">
            💧 ORDEN DE LAVADO 💧
        </div>
        
        <div class="barcode-section">
            <div class="barcode-title">🎫 ID DE ORDEN</div>
            <div class="barcode-visual">${generateBarcodeLines(transaction.ticketId)}</div>
            <div class="barcode-code">${transaction.ticketId}</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-line">
            <span class="label">📅 Fecha:</span>
            <span class="value">${startDate}</span>
        </div>
        
        <div class="info-line">
            <span class="label">⏰ Hora:</span>
            <span class="value">${startTime}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-line">
            <span class="label">${getVehicleEmoji(transaction.vehicleType)} Tipo:</span>
            <span class="value">${transaction.vehicleType}</span>
        </div>
        
        <div class="info-line">
            <span class="label">🚗 Placa:</span>
            <span class="value">${transaction.placa}</span>
        </div>
        
        ${transaction.estimatedTime ? `
        <div class="info-line">
            <span class="label">⏱️ Tiempo Est.:</span>
            <span class="value">${transaction.estimatedTime} min</span>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <div class="service-section">
            <div class="service-name">✨ ${transaction.serviceName} ✨</div>
            <div class="service-price">$${transaction.basePrice.toLocaleString('es-CO')}</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-line">
            <span class="label">👷 Trabajador:</span>
            <span class="value">${transaction.workerName}</span>
        </div>
        
        <div class="commission-section">
            <div class="commission-title">📊 DISTRIBUCIÓN</div>
            <div class="info-line">
                <span class="label">Comisión (${transaction.workerPercentage}%):</span>
                <span class="value">$${transaction.workerCommission.toLocaleString('es-CO')}</span>
            </div>
            <div class="info-line">
                <span class="label">Empresa:</span>
                <span class="value">$${transaction.companyEarning.toLocaleString('es-CO')}</span>
            </div>
        </div>
        
        <div class="separator"></div>
        
        <div class="footer">
            <div class="footer-message">${ticketData.footerMessage}</div>
            <div class="footer-info">
                📍 ${ticketData.address}<br>
                📧 ${ticketData.email} | 📞 ${ticketData.phone}<br>
                ${ticketData.footerInfo}
            </div>
            <div style="font-size: 9px; opacity: 0.8; margin-top: 8px; position: relative; z-index: 1; color: rgba(255,255,255,0.8);">
                Ticket generado el ${currentDate} a las ${currentTime}<br>
                Sistema POS Wilson v2.0 | ID: ${transaction.id.substring(0, 8)}
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