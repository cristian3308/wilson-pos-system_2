import { getDualDB } from '../lib/dualDatabase';

interface TicketData {
  id: string;
  barcode: string;
  placa: string;
  vehicleType: string;
  fechaEntrada?: Date;
  fechaSalida?: Date;
  tiempoTotal?: string;
  valorPagar?: number;
  // Nuevas propiedades del ticket completado
  entryTime?: Date;
  exitTime?: Date;
  totalMinutes?: number;
  totalAmount?: number;
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

  // Convertir ticket ID a formato EAN-13 válido (13 dígitos exactos)
  const convertToEAN13 = (code: string): string => {
    // Extraer solo números del código
    let numbers = code.replace(/\D/g, '');
    
    // Si es muy corto, agregar timestamp
    if (numbers.length < 6) {
      numbers = Date.now().toString().slice(-6) + numbers;
    }
    
    // Asegurar exactamente 12 dígitos base
    const base = numbers.padStart(12, '0').substring(0, 12);
    
    // Calcular check digit EAN-13 estándar
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const weight = (i % 2 === 0) ? 1 : 3;
      sum += parseInt(base[i]) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    // Retornar exactamente 13 dígitos
    const ean13 = base + checkDigit;
    console.log('EAN-13 generado:', ean13, 'desde código:', code);
    return ean13;
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');
    
    // Cargar tipos de vehículos personalizados
    let vehicleTypeName: string = data.ticket.vehicleType;
    let vehicleTarifa: number = data.vehicleType?.tarifa || 0;
    
    // console.log('🔍 DEBUG TICKET - Tipo de vehículo recibido:', data.ticket.vehicleType);
    // console.log('🔍 DEBUG TICKET - Data completa:', data.ticket);
    
    try {
      const { getLocalDB } = await import('../lib/localDatabase');
      const localDB = getLocalDB();
      const customTypes = await localDB.getVehicleTypes();
      
      // console.log('🔍 DEBUG TICKET - Tipos personalizados disponibles:', customTypes);
      
      // Buscar el tipo personalizado por ID
      const customType = customTypes.find((vt: any) => vt.id === data.ticket.vehicleType);
      if (customType) {
        vehicleTypeName = customType.name;
        vehicleTarifa = customType.tarifa;
        // console.log('✅ Tipo de vehículo personalizado encontrado:', vehicleTypeName, '- Tarifa:', vehicleTarifa);
      } else {
        // console.log('⚠️ No se encontró tipo personalizado, usando predeterminados');
        // Si no es personalizado, usar nombres predeterminados
        const defaultNames: Record<string, string> = {
          'car': 'Carro',
          'motorcycle': 'Moto',
          'truck': 'Camión'
        };
        vehicleTypeName = defaultNames[data.ticket.vehicleType] || data.ticket.vehicleType;
        // console.log('📝 Nombre final:', vehicleTypeName);
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
    <title>PARKING TICKET</title>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
    <style>
        /* Configuración para impresoras POS térmicas 58mm (203DPI, ESC/POS) */
        @media print {
            @page {
                size: 58mm auto;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 2mm;
                width: 58mm;
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
            font-size: 17px;
            font-weight: bold;
            background: white;
            color: black;
            line-height: 2.0;
            width: 58mm;
            margin: 0;
            padding: 2mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: black;
            margin: 0 auto;
            text-align: center;
        }
        
        /* Logo removed - thermal printers can't handle it */
        .logo {
            display: none;
        }
        
        /* Header - Solo texto, sin backgrounds */
        .header {
            text-align: center;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            margin: 0 auto 18px auto;
            width: 100%;
        }
        
        .company-name {
            font-size: 21px;
            font-weight: bold;
            margin: 0 auto 10px auto;
            letter-spacing: 1px;
            text-align: center;
            width: 100%;
        }
        
        .company-subtitle {
            font-size: 19px;
            font-weight: bold;
            margin: 0 auto 10px auto;
            text-align: center;
            width: 100%;
        }
        
        .nit {
            font-size: 17px;
            font-weight: bold;
            margin: 10px auto 0 auto;
            text-align: center;
            width: 100%;
        }
        
        /* Tipo de ticket - Con líneas divisorias */
        .ticket-type {
            text-align: center;
            font-weight: bold;
            font-size: 22px;
            margin: 18px auto;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            background: white;
            color: black;
            letter-spacing: 3px;
            width: 100%;
        }
        
        /* Líneas de información */
        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 17px;
            font-weight: bold;
            padding: 8px 0;
            text-align: center;
        }
        
        .label {
            font-weight: bold;
            color: black;
        }
        
        .value {
            text-align: right;
            font-weight: bold;
            color: black;
        }
        
        /* Separador - Línea punteada más gruesa */
        .separator {
            border-top: 4px dashed black;
            margin: 15px 0;
        }
        
        /* Código de barras - Con líneas divisorias */
        .barcode-section {
            text-align: center;
            margin: 18px auto;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            background: white;
            width: 100%;
        }
        
        .barcode-title {
            display: none;
        }
        
        .barcode-visual {
            font-family: 'Libre Barcode EAN13 Text', monospace;
            font-size: 140px;
            margin: 20px auto;
            letter-spacing: 0px;
            line-height: 1.0;
            font-weight: normal;
            color: #000000;
            background: #FFFFFF;
            padding: 18px 0;
            text-align: center;
            height: auto;
            min-height: 160px;
            display: block;
            overflow: visible;
            box-sizing: border-box;
            width: 100%;
            transform: scaleY(1.3);
        }
        
        .barcode-code {
            display: none;
        }
        
        .barcode-container {
            margin: 8px 0;
            padding: 0;
            border: none;
            background: white;
            overflow: visible;
        }
        
        .placa-highlight {
            font-size: 18px;
            letter-spacing: 4px;
            padding: 10px 0;
            font-weight: bold;
            border: 5px solid black;
            text-align: center;
            margin: 12px 0;
        }
        
        /* Sección de total - Con líneas divisorias */
        .total-section {
            text-align: center;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            margin: 18px auto;
            background: white;
            color: black;
            width: 100%;
        }
        
        .total-label {
            font-size: 18px;
            font-weight: bold;
            margin: 0 auto 10px auto;
            text-align: center;
            width: 100%;
        }
        
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            margin: 10px auto;
            letter-spacing: 3px;
            text-align: center;
            width: 100%;
        }
        
        /* Footer - Con líneas divisorias */
        .footer {
            text-align: center;
            font-size: 16px;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            margin: 18px auto 0 auto;
            line-height: 2.0;
            color: black;
            width: 100%;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 6px;
            font-size: 18px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .footer-info {
            margin: 5px 0;
            line-height: 1.7;
            font-weight: bold;
            opacity: 0.9;
            font-size: 18px;
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
        

        
        /* Optimización para impresión térmica */
        @media print {
            @page {
                size: 58mm auto;
                margin: 0;
            }
            
            body { 
                margin: 0; 
                padding: 4mm; 
                background: white;
                width: 58mm;
            }
            .ticket { 
                page-break-inside: avoid;
                box-shadow: none;
            }
            .logo {
                display: none;
            }
            .barcode-visual {
                font-size: 150px;
                height: auto;
                min-height: 170px;
                padding: 18px 0;
                line-height: 1.0;
                overflow: visible;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                transform: scaleY(1.3);
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <img class="logo" src="data:image/jpeg;base64,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FNb/APxFf2aUUAfxaf8ADmT9rb/oU/C//hTW/wD8RR/w5k/a2/6FPwv/AOFNb/8AxFf2aUUAfxaf8OZP2tv+hT8L/wDhTW//AMRR/wAOZP2tv+hT8L/+FNb/APxFf2aUUAfxaf8ADmT9rb/oU/C//hTW/wD8RR/w5k/a2/6FPwv/AOFNb/8AxFf2aUUAfxaf8OZP2tv+hT8L/wDhTW//AMRR/wAOZP2tv+hT8L/+FNb/APxFf2aUUAfxaf8ADmT9rb/oU/C//hTW/wD8RX7Tf8Elf+Ddz9on9gf/AIKMf8OZP2tv+hT8L/8AhTW//wARX9mlFAH85v8Aw5k/a2/6FPwv/wCFNb//ABFH/DmT9rb/AKFPwv8A+FNb/wDxFf2aUUAfxaf8OZP2tv+hT8L/APhTW/8A8RR/w5k/a2/6FPwv/wCFNb//ABFf2aUUAfxaf8OZP2tv+hT8L/8AhTW//wARR/w5k/a2/6FPwv8A+FNb/wDxFf2aUUAfxaf8OZP2tv8AoU/C/wD4U1v/APEV/p/w5k/a2/6FPwv/AOFNb/8AxFf2aUUAfxaf8OZP2tv+hT8L/wDhTW//AMRR/wAOZP2tv+hT8L/+FNb/APxFf2aUUAfxaf8ADmT9rb/oU/C//hTW/wD8RR/w5k/a2/6FPwv/AOFNb/8AxFf2aUUAfxaf8OZP2tv+hT8L/wDhTW//AMRR/wAOZP2tv+hT8L/+FNb/APxFf2aUUAfxaf8ADmT9rb/oU/C//hTW/wD8RR/w5k/a2/6FPwv/AOFNb/8AxFf2aUUAfxaf8OZP2tv+hT8L/wDhTW//AMRR/wAOZP2tv+hT8L/+FNb/APxFf2aUUAfxaf8ADmT9rb/oU/C//hTW/wD8RX6Cf8Ex/wDg3//AGh/2e/8AgpV8K/2kvH2leENP8L/D68mvL3VbTxDBcX2pyS2d9aQrDAquu x5btEyZEGJM/NzX9xlFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQB//Z" alt="Wilson Cars & Wash Logo">
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
            <span class="value">${data.type === 'entry' ? 
                (data.ticket.fechaEntrada || data.ticket.entryTime || new Date()).toLocaleString('es-CO') : 
                (data.ticket.fechaSalida || data.ticket.exitTime || new Date()).toLocaleString('es-CO')
            }</span>
        </div>
        
        ${data.type === 'exit' ? `
        <div class="info-line">
            <span class="label">Tiempo:</span>
            <span class="value">${data.ticket.tiempoTotal || '0h 0min'}</span>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        ${data.type === 'entry' ? `
        <div class="barcode-section">
            <div class="barcode-visual">${data.ticket.barcode}</div>
        </div>
        
        <div class="separator"></div>
        ` : ''}
        
        ${data.type === 'exit' ? `
        <div class="total-section">
            <div class="total-label">TOTAL A PAGAR</div>
            <div class="total-amount">$${(data.ticket.totalAmount || data.ticket.valorPagar || 0).toLocaleString('es-CO')}</div>
            <div style="font-size: 18px; font-weight: bold; margin-top: 8px; text-align: center;">
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
            <div style="font-size: 18px; margin-top: 3px; font-weight: bold;">
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
            font-size: 48px;
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
                    <span class="value">${(data.ticket.fechaEntrada || data.ticket.entryTime || new Date()).toLocaleDateString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Hora de Entrada</span>
                    <span class="value">${(data.ticket.fechaEntrada || data.ticket.entryTime || new Date()).toLocaleTimeString('es-CO')}</span>
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
                    <span class="value">${(data.ticket.fechaEntrada || data.ticket.entryTime || new Date()).toLocaleString('es-CO')}</span>
                </div>
                <div class="info-row">
                    <span class="label">Salida</span>
                    <span class="value">${(data.ticket.fechaSalida || data.ticket.exitTime)?.toLocaleString('es-CO') || ''}</span>
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

  // Convertir ticket ID a formato EAN-13 válido (13 dígitos exactos)
  const convertToEAN13 = (code: string): string => {
    // Extraer solo números del código
    let numbers = code.replace(/\D/g, '');
    
    // Si es muy corto, agregar timestamp
    if (numbers.length < 6) {
      numbers = Date.now().toString().slice(-6) + numbers;
    }
    
    // Asegurar exactamente 12 dígitos base
    const base = numbers.padStart(12, '0').substring(0, 12);
    
    // Calcular check digit EAN-13 estándar
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const weight = (i % 2 === 0) ? 1 : 3;
      sum += parseInt(base[i]) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    // Retornar exactamente 13 dígitos
    const ean13 = base + checkDigit;
    console.log('EAN-13 generado:', ean13, 'desde código:', code);
    return ean13;
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');
    const startDate = new Date(transaction.startTime).toLocaleDateString('es-CO');
    const startTime = new Date(transaction.startTime).toLocaleTimeString('es-CO');
    
    // 🔥 IMPORTANTE: Usar el barcode guardado si existe, sino generarlo
    const getBarcodeForPrint = (): string => {
      if ((transaction as any).barcode) {
        console.log('📋 Usando barcode existente de la transacción:', (transaction as any).barcode);
        return (transaction as any).barcode;
      }
      // Fallback para órdenes antiguas sin barcode
      const generated = convertToEAN13(transaction.ticketId);
      console.log('⚠️ Barcode no encontrado, generando nuevo:', generated);
      return generated;
    };
    const barcodeToUse = getBarcodeForPrint();
    
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
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page {
            size: 58mm auto;
            margin: 0;
        }
        
        body {
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 18px;
            font-weight: bold;
            background: white;
            color: #000;
            line-height: 2.0;
            width: 58mm;
            margin: 0 auto;
            padding: 2mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: #000;
        }
        
        /* Logo de la empresa */
        .logo {
            max-width: 45mm;
            width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 5px auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 18px;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
        }
        
        .company-name {
            font-size: 21px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.7;
        }
        
        .company-subtitle {
            font-size: 19px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.7;
        }
        
        .nit {
            font-size: 17px;
            font-weight: bold;
            line-height: 1.7;
        }
        
        .ticket-type {
            text-align: center;
            font-weight: bold;
            font-size: 22px;
            margin: 18px 0;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
            line-height: 1.7;
        }
        
        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 17px;
            line-height: 2.0;
            font-weight: bold;
        }
        
        .label {
            font-weight: bold;
        }
        
        .value {
            text-align: right;
            font-weight: bold;
        }
        
        .separator {
            border-top: 4px solid #000;
            margin: 15px 0;
        }
        
        .barcode-section {
            text-align: center;
            margin: 18px 0;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
        }
        
        .barcode-title {
            display: none;
        }
        
        .barcode-visual {
            font-family: 'Libre Barcode EAN13 Text', monospace;
            font-size: 140px;
            margin: 20px auto;
            letter-spacing: 0px;
            line-height: 1.0;
            font-weight: normal;
            color: #000000;
            background: #FFFFFF;
            padding: 18px 0;
            text-align: center;
            height: auto;
            min-height: 160px;
            display: block;
            overflow: visible;
            box-sizing: border-box;
            width: 100%;
            transform: scaleY(1.3);
        }
        
        .barcode-code {
            display: none !important;
            visibility: hidden !important;
        }
        
        .service-section {
            text-align: center;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
            margin: 18px 0;
        }
        
        .service-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.7;
        }
        
        .service-price {
            font-size: 22px;
            font-weight: bold;
            margin: 6px 0;
            line-height: 1.6;
        }
        
        .commission-section {
            display: none;
        }
        
        .commission-title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 8px;
            line-height: 1.7;
        }
        
        .footer {
            text-align: center;
            margin-top: 18px;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            padding: 15px 0;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 18px;
            line-height: 1.8;
        }
        
        .footer-info {
            margin: 8px 0;
            line-height: 1.8;
            font-size: 15px;
            font-weight: bold;
            text-align: center;
        }
        
        .placa-highlight {
            font-size: 24px;
            letter-spacing: 5px;
            padding: 15px 0;
            font-weight: bold;
            border-top: 3px solid #000;
            border-bottom: 3px solid #000;
            text-align: center;
            margin: 18px 0;
        }
        
        @media print {
            body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .logo {
                display: none;
            }
            .barcode-visual {
                font-size: 150px;
                height: auto;
                min-height: 170px;
                padding: 18px 0;
                line-height: 1.0;
                overflow: visible;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                transform: scaleY(1.3);
            }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <img class="logo" src="data:image/jpeg;base64,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\" alt=\"Wilson Cars & Wash Logo\">
            <div class="company-name">${ticketData.companyName}</div>
            <div class="company-subtitle">${ticketData.companySubtitle}</div>
            <div class="nit">NIT: ${ticketData.nit}</div>
        </div>
        
        <div class="ticket-type">
            **ORDEN DE LAVADO**
        </div>
        
        <div class="barcode-section">
            <div class="barcode-visual">${barcodeToUse}</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-line">
            <span class="label">Fecha:</span>
            <span class="value">${startDate}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Hora:</span>
            <span class="value">${startTime}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="info-line">
            <span class="label">Tipo:</span>
            <span class="value">${transaction.vehicleType}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Placa:</span>
            <span class="value" style="font-size: 14px; font-weight: bold; letter-spacing: 2px;">${transaction.placa}</span>
        </div>
        
        ${transaction.estimatedTime ? `
        <div class="info-line">
            <span class="label">Tiempo Est.:</span>
            <span class="value">${transaction.estimatedTime} min</span>
        </div>
        ` : ''}
        
        <div class="separator"></div>
        
        <div class="service-section">
            <div class="service-name">${transaction.serviceName}</div>
            <div class="service-price">$${transaction.basePrice.toLocaleString('es-CO')}</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="footer">
            <div class="footer-message">${ticketData.footerMessage}</div>
            <div class="footer-info">
                ${ticketData.address}
            </div>
            <div class="footer-info">
                ${ticketData.email} | ${ticketData.phone}
            </div>
            <div class="footer-info">
                ${ticketData.footerInfo}
            </div>
            <div class="footer-info" style="margin-top: 10mm;">
                Ticket: ${currentDate} - ${currentTime}
            </div>
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

// Interfaz para datos de suscripción mensual
interface MonthlySubscriptionData {
  id: string;
  vehiclePlate: string;
  vehicleType: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  subscriptionType: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  customDays?: number;
  startDate: Date;
  endDate: Date;
  amount: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  notes?: string;
}

// Función para imprimir factura de suscripción mensual
export const printMonthlySubscriptionInvoice = async (subscription: MonthlySubscriptionData) => {
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

  const convertToEAN13 = (code: string): string => {
    let numbers = code.replace(/\D/g, '');
    if (numbers.length < 6) {
      numbers = Date.now().toString().slice(-6) + numbers;
    }
    const base = numbers.padStart(12, '0').substring(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const weight = (i % 2 === 0) ? 1 : 3;
      sum += parseInt(base[i]) * weight;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const currentDate = new Date().toLocaleDateString('es-CO');
    const currentTime = new Date().toLocaleTimeString('es-CO');
    
    const subscriptionTypeLabels: Record<string, string> = {
      daily: 'DIARIO',
      weekly: 'SEMANAL',
      biweekly: 'QUINCENAL',
      monthly: 'MENSUAL',
      custom: 'PERSONALIZADO'
    };

    const subscriptionLabel = subscriptionTypeLabels[subscription.subscriptionType] || subscription.subscriptionType.toUpperCase();
    const daysCount = subscription.customDays || 
      (subscription.subscriptionType === 'daily' ? 1 :
       subscription.subscriptionType === 'weekly' ? 7 :
       subscription.subscriptionType === 'biweekly' ? 15 : 30);

    const paymentMethodLabels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia'
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SUSCRIPCIÓN MENSUAL</title>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
    <style>
        /* MISMO FORMATO EXACTO DEL PARQUEADERO */
        @media print {
            @page {
                size: 58mm auto;
                margin: 0;
            }
            body {
                margin: 0;
                padding: 2mm;
                width: 58mm;
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
            font-size: 17px;
            font-weight: bold;
            background: white;
            color: black;
            line-height: 2.0;
            width: 58mm;
            margin: 0;
            padding: 2mm;
        }
        
        .ticket {
            width: 100%;
            background: white;
            color: black;
            margin: 0 auto;
            text-align: center;
        }
        
        /* Header - Solo texto, sin backgrounds */
        .header {
            text-align: center;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            margin: 0 auto 18px auto;
            width: 100%;
        }
        
        .company-name {
            font-size: 21px;
            font-weight: bold;
            margin: 0 auto 10px auto;
            letter-spacing: 1px;
            text-align: center;
            width: 100%;
        }
        
        .company-subtitle {
            font-size: 19px;
            font-weight: bold;
            margin: 0 auto 10px auto;
            text-align: center;
            width: 100%;
        }
        
        .nit {
            font-size: 17px;
            font-weight: bold;
            margin: 10px auto 0 auto;
            text-align: center;
            width: 100%;
        }
        
        /* Tipo de suscripción - Con líneas divisorias */
        .ticket-type {
            text-align: center;
            font-weight: bold;
            font-size: 22px;
            margin: 18px auto;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            background: white;
            color: black;
            letter-spacing: 3px;
            width: 100%;
        }
        
        /* Líneas de información */
        .info-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 17px;
            font-weight: bold;
            padding: 8px 0;
            text-align: center;
        }
        
        .label {
            font-weight: bold;
            color: black;
        }
        
        .value {
            text-align: right;
            font-weight: bold;
            color: black;
        }
        
        /* Separador - Línea punteada más gruesa */
        .separator {
            border-top: 4px dashed black;
            margin: 15px 0;
        }
        
        /* Código de barras - Con líneas divisorias */
        .barcode-section {
            text-align: center;
            margin: 18px auto;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            background: white;
            width: 100%;
        }
        
        .barcode-title {
            display: none;
        }
        
        .barcode-visual {
            font-family: 'Libre Barcode EAN13 Text', monospace;
            font-size: 140px;
            margin: 20px auto;
            letter-spacing: 0px;
            line-height: 1.0;
            font-weight: normal;
            color: #000000;
            background: #FFFFFF;
            padding: 18px 0;
            text-align: center;
            height: auto;
            min-height: 160px;
            display: block;
            overflow: visible;
            box-sizing: border-box;
            width: 100%;
            transform: scaleY(1.3);
        }
        
        .barcode-code {
            display: none;
        }
        
        .barcode-container {
            margin: 8px 0;
            padding: 0;
            border: none;
            background: white;
            overflow: visible;
        }
        
        .placa-highlight {
            font-size: 18px;
            letter-spacing: 4px;
            padding: 10px 0;
            font-weight: bold;
            border: 5px solid black;
            text-align: center;
            margin: 12px 0;
        }
        
        /* Sección de total - Con líneas divisorias */
        .total-section {
            text-align: center;
            border-top: 3px solid black;
            border-bottom: 3px solid black;
            padding: 15px 0;
            margin: 18px auto;
            background: white;
            color: black;
            width: 100%;
        }
        
        .total-label {
            font-size: 18px;
            font-weight: bold;
            margin: 0 auto 10px auto;
            text-align: center;
            width: 100%;
        }
        
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            margin: 10px auto;
            letter-spacing: 3px;
            text-align: center;
            width: 100%;
        }
        
        .info-label {
            font-weight: bold;
        }
        
        .info-value {
            text-align: right;
        }
        
        .client-section {
            margin: 3mm 0;
            padding: 2mm;
            background: #f5f5f5;
            border-radius: 2mm;
        }
        
        .client-name {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 1mm;
        }
        
        .vehicle-plate {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            padding: 2mm;
            background: #000;
            color: #fff;
            margin: 2mm 0;
            letter-spacing: 2px;
        }
        
        .dates-section {
            margin: 3mm 0;
            padding: 2mm;
            border: 2px solid #000;
        }
        
        .date-row {
            display: flex;
            justify-content: space-between;
            margin: 1mm 0;
            font-size: 9pt;
        }
        
        .date-label {
            font-weight: bold;
        }
        
        .validity-warning {
            text-align: center;
            font-size: 8pt;
            margin: 2mm 0;
            padding: 2mm;
            background: #ffffcc;
            border: 1px solid #000;
        }
        
        .amount-section {
            margin: 3mm 0;
            padding: 3mm;
            background: #f0f0f0;
            border: 2px solid #000;
        }
        
        .amount-label {
            text-align: center;
            font-size: 8pt;
            margin-bottom: 1mm;
        }
        
        .amount-value {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
        }
        
        .barcode-section {
            margin: 3mm 0;
            text-align: center;
        }
        
        .barcode-display {
            font-family: 'Libre Barcode EAN13 Text', cursive;
            font-size: 48pt;
            letter-spacing: 2px;
            line-height: 1;
            margin: 2mm 0;
        }
        
        .barcode-number {
            font-size: 9pt;
            letter-spacing: 1px;
            margin-top: 1mm;
        }
        
        .footer {
            margin-top: 3mm;
            padding-top: 2mm;
            border-top: 1px dashed #000;
            text-align: center;
        }
        
        .footer-message {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 2mm;
        }
        
        .footer-info {
            font-size: 7pt;
            color: #666;
        }
        
        .notes-section {
            margin: 2mm 0;
            padding: 2mm;
            background: #f9f9f9;
            font-size: 7pt;
            border-left: 2px solid #000;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- Header - IGUAL AL PARQUEADERO -->
        <div class="header">
            <div class="company-name">${ticketData.companyName}</div>
            <div class="company-subtitle">${ticketData.companySubtitle}</div>
            <div class="nit">NIT: ${ticketData.nit}</div>
            <div class="nit">Línea ${ticketData.phone.replace('+57 ', '')}</div>
        </div>

        <!-- TIPO DE SUSCRIPCIÓN - LETRAS GRANDES -->
        <div class="ticket-type">
            SUSCRIPCIÓN ${subscriptionLabel}
        </div>

        <!-- PLACA - FORMATO DESTACADO -->
        <div class="placa-highlight">
            Placa
        </div>
        <div class="info-line">
            <span class="label">Tel:</span>
            <span class="value">${subscription.vehiclePlate}</span>
        </div>

        <!-- SEPARADOR -->
        <div class="separator"></div>

        <!-- INFORMACIÓN DEL CLIENTE -->
        <div class="info-line">
            <span class="label">Nombre:</span>
            <span class="value">${subscription.clientName}</span>
        </div>
        <div class="info-line">
            <span class="label">Tel:</span>
            <span class="value">${subscription.clientPhone}</span>
        </div>
        ${subscription.clientEmail ? `
        <div class="info-line">
            <span class="label">Email:</span>
            <span class="value">${subscription.clientEmail}</span>
        </div>
        ` : ''}

        <!-- SEPARADOR -->
        <div class="separator"></div>

        <!-- FECHAS - FORMATO GRANDE Y CLARO -->
        <div class="info-line">
            <span class="label">Tipo de Vehículo:</span>
            <span class="value">${subscription.vehicleType}</span>
        </div>
        <div class="info-line">
            <span class="label">Tipo de Plan:</span>
            <span class="value">${subscriptionLabel}</span>
        </div>
        <div class="info-line">
            <span class="label">Días:</span>
            <span class="value">${daysCount}</span>
        </div>
        <div class="info-line">
            <span class="label">Forma de Pago:</span>
            <span class="value">${paymentMethodLabels[subscription.paymentMethod || 'cash']}</span>
        </div>

        <!-- SEPARADOR -->
        <div class="separator"></div>

        <!-- FECHAS DE VIGENCIA -->
        <div class="info-line">
            <span class="label">INICIA:</span>
            <span class="value">${new Date(subscription.startDate).toLocaleDateString('es-CO')}</span>
        </div>
        <div class="info-line">
            <span class="label">VENCE:</span>
            <span class="value">${new Date(subscription.endDate).toLocaleDateString('es-CO')}</span>
        </div>

        <!-- ADVERTENCIA DE VIGENCIA -->
        <div class="ticket-type">
            ⚠️ VÁLIDO HASTA EL ${new Date(subscription.endDate).getDate()} de ${new Date(subscription.endDate).toLocaleDateString('es-CO', { month: 'long' })} de ${new Date(subscription.endDate).getFullYear()} ⚠️
        </div>

        <!-- SEPARADOR -->
        <div class="separator"></div>

        <!-- VALOR PAGADO - DESTACADO -->
        <div class="total-section">
            <div class="total-label">VALOR PAGADO</div>
            <div class="total-amount">$${subscription.amount.toLocaleString('es-CO')}</div>
        </div>

        ${subscription.notes ? `
        <!-- SEPARADOR -->
        <div class="separator"></div>
        
        <!-- NOTAS -->
        <div class="info-line">
            <span class="label">Notas:</span>
        </div>
        <div style="text-align: center; padding: 8px 0; font-size: 15px;">
            ${subscription.notes}
        </div>
        ` : ''}

        <!-- CÓDIGO DE BARRAS - TAMAÑO GRANDE COMO PARQUEADERO -->
        <div class="barcode-section">
            <div class="barcode-container">
                <div class="barcode-visual">${convertToEAN13(subscription.id)}</div>
            </div>
        </div>

        <!-- SEPARADOR FINAL -->
        <div class="separator"></div>

        <!-- MENSAJE FINAL -->
        <div style="text-align: center; padding: 15px 0;">
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                ${ticketData.footerMessage}
            </div>
            <div style="font-size: 17px; margin-bottom: 8px;">
                ${ticketData.footerInfo}
            </div>
            <div style="font-size: 15px; margin-top: 10px;">
                Ticket: ${currentDate} - ${currentTime}
            </div>
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