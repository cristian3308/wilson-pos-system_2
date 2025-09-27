// Servicio para manejo de lectores de código de barras USB/Serial
export class BarcodeReaderService {
  private static instance: BarcodeReaderService;
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private isConnected: boolean = false;
  private isReading: boolean = false;
  private onBarcodeScanned: ((barcode: string) => void) | null = null;
  private connectionCallbacks: (() => void)[] = [];
  private disconnectionCallbacks: (() => void)[] = [];

  // Configuraciones comunes para lectores de código de barras
  private readonly BARCODE_READER_CONFIGS = [
    { baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1 }, // Más común
    { baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1 },
    { baudRate: 38400, dataBits: 8, parity: 'none', stopBits: 1 },
    { baudRate: 19200, dataBits: 8, parity: 'none', stopBits: 1 },
    { baudRate: 4800, dataBits: 8, parity: 'none', stopBits: 1 }
  ];

  // Palabras clave para identificar lectores de código de barras
  private readonly BARCODE_READER_KEYWORDS = [
    'barcode', 'scanner', 'honeywell', 'zebra', 'datalogic', 
    'symbol', 'motorola', 'code', 'scan', 'reader', 'ccd',
    'laser', 'imager', '1d', '2d', 'qr'
  ];

  private constructor() {
    // Detectar desconexión
    if (typeof window !== 'undefined' && 'serial' in navigator) {
      navigator.serial.addEventListener('disconnect', () => {
        this.handleDisconnection();
      });
    }
  }

  public static getInstance(): BarcodeReaderService {
    if (!BarcodeReaderService.instance) {
      BarcodeReaderService.instance = new BarcodeReaderService();
    }
    return BarcodeReaderService.instance;
  }

  // Verificar soporte de Web Serial API
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'serial' in navigator;
  }

  // Obtener lista de puertos disponibles
  public async getAvailablePorts(): Promise<SerialPort[]> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API no es compatible con este navegador');
    }

    try {
      return await navigator.serial.getPorts();
    } catch (error) {
      console.error('Error obteniendo puertos seriales:', error);
      return [];
    }
  }

  // Detectar automáticamente lectores de código de barras
  public async detectBarcodeReaders(): Promise<{
    found: boolean;
    devices: { port: SerialPort; info: SerialPortInfo | undefined; score: number }[];
    message: string;
  }> {
    if (!this.isSupported()) {
      return {
        found: false,
        devices: [],
        message: 'Web Serial API no compatible'
      };
    }

    try {
      const ports = await this.getAvailablePorts();
      const detectedReaders: { port: SerialPort; info: SerialPortInfo | undefined; score: number }[] = [];

      for (const port of ports) {
        const info = port.getInfo();
        const score = this.calculateBarcodeReaderScore(info);
        
        if (score > 0) {
          detectedReaders.push({ port, info, score });
        }
      }

      // Ordenar por puntuación (más probable primero)
      detectedReaders.sort((a, b) => b.score - a.score);

      return {
        found: detectedReaders.length > 0,
        devices: detectedReaders,
        message: detectedReaders.length > 0 
          ? `Se encontraron ${detectedReaders.length} posible(s) lector(es) de código de barras`
          : 'No se encontraron lectores de código de barras'
      };
    } catch (error) {
      console.error('Error detectando lectores:', error);
      return {
        found: false,
        devices: [],
        message: 'Error al detectar dispositivos'
      };
    }
  }

  // Calcular puntuación de probabilidad de ser un lector de código de barras
  private calculateBarcodeReaderScore(info: SerialPortInfo | undefined): number {
    if (!info) return 0;

    let score = 0;
    const vendor = (info as any).vendorId?.toString(16).toLowerCase() || '';
    const product = (info as any).productId?.toString(16).toLowerCase() || '';

    // Vendor IDs conocidos de fabricantes de lectores de código de barras
    const knownVendors: { [key: string]: number } = {
      '05e0': 8, // Symbol Technologies (ahora Zebra)
      '0c2e': 8, // Honeywell
      '1a0a': 6, // Datalogic
      '04b4': 4, // Cypress (usado en algunos scanners)
      '0483': 3, // STMicroelectronics (usado en algunos scanners baratos)
      '2341': 2, // Arduino (algunos proyectos DIY)
    };

    // Verificar vendor conocido
    if (knownVendors[vendor]) {
      score += knownVendors[vendor];
    }

    // Buscar palabras clave en la descripción del dispositivo
    const deviceString = `${vendor} ${product}`.toLowerCase();
    for (const keyword of this.BARCODE_READER_KEYWORDS) {
      if (deviceString.includes(keyword)) {
        score += 2;
      }
    }

    return score;
  }

  // Solicitar permiso para conectar a un dispositivo
  public async requestBarcodeReader(): Promise<{
    success: boolean;
    port?: SerialPort;
    message: string;
  }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Web Serial API no es compatible con este navegador'
      };
    }

    try {
      const port = await navigator.serial.requestPort({
        filters: [
          // Filtros para lectores de código de barras conocidos
          { usbVendorId: 0x05e0 }, // Symbol/Zebra
          { usbVendorId: 0x0c2e }, // Honeywell
          { usbVendorId: 0x1a0a }, // Datalogic
        ]
      });

      return {
        success: true,
        port,
        message: 'Lector de código de barras seleccionado'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.name === 'NotFoundError' 
          ? 'No se seleccionó ningún dispositivo'
          : 'Error al solicitar acceso al dispositivo'
      };
    }
  }

  // Conectar a un puerto específico
  public async connect(port?: SerialPort): Promise<{
    success: boolean;
    message: string;
  }> {
    if (this.isConnected && this.port) {
      return { success: true, message: 'Ya conectado al lector de código de barras' };
    }

    const targetPort = port || this.port;
    if (!targetPort) {
      return { success: false, message: 'No hay puerto disponible para conectar' };
    }

    // Intentar diferentes configuraciones
    for (const config of this.BARCODE_READER_CONFIGS) {
      try {
        console.log(`🔄 Intentando conectar con baudRate: ${config.baudRate}...`);
        
        await targetPort.open(config as SerialOptions);
        
        this.port = targetPort;
        this.isConnected = true;
        
        console.log(`✅ Conectado al lector de código de barras con baudRate: ${config.baudRate}`);
        
        // Iniciar lectura automática
        this.startReading();
        
        // Notificar conexión exitosa
        this.connectionCallbacks.forEach(callback => callback());
        
        return {
          success: true,
          message: `Conectado exitosamente (${config.baudRate} baud)`
        };
      } catch (error) {
        console.log(`❌ Falló conexión con baudRate ${config.baudRate}:`, error);
        continue;
      }
    }

    return {
      success: false,
      message: 'No se pudo conectar con ninguna configuración'
    };
  }

  // Iniciar lectura continua de códigos de barras
  private async startReading(): Promise<void> {
    if (!this.port || !this.isConnected || this.isReading) return;

    try {
      this.isReading = true;
      
      // Crear un transform stream para manejar los datos del puerto serial
      const transformer = new TransformStream({
        transform(chunk, controller) {
          // chunk es Uint8Array, lo convertimos a string
          const text = new TextDecoder().decode(chunk);
          controller.enqueue(text);
        }
      });

      // Conectar el puerto con el transformer
      this.port.readable!.pipeTo(transformer.writable);
      this.reader = transformer.readable.getReader();

      let buffer = '';

      while (this.isReading && this.port) {
        try {
          const { value, done } = await this.reader.read();
          if (done) break;

          buffer += value;
          
          // Buscar códigos de barras completos (terminados en \r, \n, o ambos)
          const lines = buffer.split(/[\r\n]+/);
          buffer = lines.pop() || ''; // Mantener la última línea incompleta

          for (const line of lines) {
            const barcode = line.trim();
            if (barcode.length > 0) {
              console.log('📊 Código de barras detectado:', barcode);
              this.handleBarcodeScanned(barcode);
            }
          }
        } catch (error) {
          console.error('Error leyendo datos del lector:', error);
          break;
        }
      }
    } catch (error) {
      console.error('Error iniciando lectura:', error);
    } finally {
      this.isReading = false;
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
    }
  }

  // Manejar código de barras escaneado
  private handleBarcodeScanned(barcode: string): void {
    if (this.onBarcodeScanned) {
      this.onBarcodeScanned(barcode);
    }
  }

  // Establecer callback para códigos escaneados
  public onBarcode(callback: (barcode: string) => void): void {
    this.onBarcodeScanned = callback;
  }

  // Desconectar del lector
  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.port) return;

    try {
      this.isReading = false;
      
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }

      await this.port.close();
      this.port = null;
      this.isConnected = false;
      
      console.log('🔌 Desconectado del lector de código de barras');
      
      // Notificar desconexión
      this.disconnectionCallbacks.forEach(callback => callback());
    } catch (error) {
      console.error('Error al desconectar:', error);
    }
  }

  // Manejar desconexión inesperada
  private handleDisconnection(): void {
    if (this.isConnected) {
      this.isConnected = false;
      this.isReading = false;
      this.port = null;
      this.reader = null;
      
      console.log('⚠️ Lector de código de barras desconectado inesperadamente');
      this.disconnectionCallbacks.forEach(callback => callback());
    }
  }

  // Suscribirse a eventos de conexión
  public onConnection(callback: () => void): void {
    this.connectionCallbacks.push(callback);
  }

  // Suscribirse a eventos de desconexión
  public onDisconnection(callback: () => void): void {
    this.disconnectionCallbacks.push(callback);
  }

  // Obtener estado actual
  public getStatus(): {
    isSupported: boolean;
    isConnected: boolean;
    isReading: boolean;
    portInfo?: SerialPortInfo;
  } {
    return {
      isSupported: this.isSupported(),
      isConnected: this.isConnected,
      isReading: this.isReading,
      portInfo: this.port?.getInfo()
    };
  }

  // Método para probar el lector (enviar comando de prueba)
  public async testReader(): Promise<{ success: boolean; message: string }> {
    if (!this.isConnected || !this.port) {
      return { success: false, message: 'Lector no conectado' };
    }

    try {
      // Algunos lectores responden a comandos específicos
      const writer = this.port.writable!.getWriter();
      
      // Comando común para activar/probar lectores
      const testCommand = new TextEncoder().encode('\r\n');
      await writer.write(testCommand);
      
      writer.releaseLock();
      
      return { success: true, message: 'Comando de prueba enviado' };
    } catch (error) {
      return { success: false, message: 'Error enviando comando de prueba' };
    }
  }
}

// Exportar instancia singleton
export const barcodeReaderService = BarcodeReaderService.getInstance();