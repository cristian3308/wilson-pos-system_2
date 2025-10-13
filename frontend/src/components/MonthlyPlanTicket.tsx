'use client';

import { getDualDB } from '../lib/dualDatabase';

interface MonthlyPlanTicketData {
  id: string;
  vehiclePlate: string;
  clientName: string;
  timeType: 'day' | 'night';
  amount: number;
  startDate: Date;
  endDate: Date;
}

const generateEAN13Barcode = (originalCode: string): string => {
  const numericCode = originalCode.replace(/\D/g, '');
  const timestamp = Date.now().toString();
  let code12 = (numericCode + timestamp).substring(0, 12).padStart(12, '0');
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code12[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return code12 + checkDigit;
};

export const printMonthlyPlanTicket = async (data: MonthlyPlanTicketData) => {
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
    address: 'Calle 123 #45-67, Bogotá D.C.'
  };

  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (printWindow) {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const validBarcode = generateEAN13Barcode(data.id);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ticket Plan Mensual</title>
    <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+EAN13+Text&display=swap" rel="stylesheet">
    <style>
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
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            background: white;
            color: black;
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
        
        .logo-img {
            width: 90px;
            height: auto;
            margin: 5px auto 8px auto;
            display: block;
        }
        
        .company-name {
            font-size: 15px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .company-address {
            font-size: 10px;
            margin: 3px 0;
            color: #333;
        }
        
        .separator {
            border-top: 1px dashed black;
            margin: 10px 0;
        }
        
        .ticket-title {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
            letter-spacing: 0.5px;
        }
        
        .time-badge {
            display: inline-block;
            padding: 8px 16px;
            margin: 10px 0;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
        }
        
        .time-badge.day {
            background: linear-gradient(135deg, #FEF3C7, #FDE047);
            color: #92400E;
            border: 2px solid #FBBF24;
        }
        
        .time-badge.night {
            background: linear-gradient(135deg, #C7D2FE, #818CF8);
            color: #312E81;
            border: 2px solid #6366F1;
        }
        
        .info-section {
            margin: 15px 0;
            text-align: left;
        }
        
        .info-label {
            font-size: 13px;
            color: #000;
            font-weight: bold;
        }
        
        .info-value {
            font-size: 16px;
            font-weight: bold;
            margin: 3px 0 10px 0;
        }
        
        .plate-value {
            font-size: 26px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 10px 0;
        }
        
        .amount-section {
            margin: 15px 0;
            padding: 10px 0;
            border-top: 2px solid black;
            border-bottom: 2px solid black;
        }
        
        .amount-label {
            font-size: 12px;
            font-weight: bold;
        }
        
        .amount-value {
            font-size: 28px;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .date-section {
            margin: 10px 0;
            font-size: 13px;
            font-weight: bold;
        }
        
        .barcode-section {
            margin: 12px 0;
        }
        
        .barcode-visual {
            font-family: 'Libre Barcode EAN13 Text', monospace;
            font-size: 170px;
            margin: 8px auto;
            line-height: 0.9;
        }
        
        .footer {
            font-size: 10px;
            margin-top: 10px;
        }
        
        .footer-message {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="ticket">
        <!-- Logo -->
        <img class="logo-img" src="/images/company-logo.jpg" alt="Logo" onerror="this.style.display='none'" />
        
        <!-- Nombre de la empresa -->
        <div class="company-name">${ticketData.companyName || 'WILSON CARS & WASH'}</div>
        <div class="company-address">${ticketData.address || 'Dirección no configurada'}</div>
        
        <div class="separator"></div>
        
        <!-- Badge de modalidad -->
        <div class="time-badge ${data.timeType}">
            ${data.timeType === 'day' ? '☀️ DIURNO' : '🌙 NOCTURNO'}
        </div>
        
        <div class="separator"></div>
        
        <!-- Información del plan -->
        <div class="info-section">
            <div class="info-label">PLACA DEL VEHICULO</div>
            <div class="plate-value">${data.vehiclePlate}</div>
            
            <div class="info-label">CLIENTE</div>
            <div class="info-value">${data.clientName}</div>
            
            <div class="date-section">
                <div><strong>Inicio:</strong> ${formatDate(data.startDate)}</div>
                <div><strong>Vence:</strong> ${formatDate(data.endDate)}</div>
            </div>
        </div>
        
        <!-- Monto -->
        <div class="amount-section">
            <div class="amount-label">Total Pagado:</div>
            <div class="amount-value">$${data.amount.toLocaleString('es-CO')}</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Código de barras -->
        <div class="barcode-section">
            <div class="barcode-visual">${validBarcode}</div>
        </div>
        
        <div class="separator"></div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-message">¡GRACIAS POR SU VISITA Y BUEN CAMINO!</div>
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
