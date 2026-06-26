# 🖨️ Guía de Configuración de Impresora POS Térmica

## 📋 Especificaciones de la Impresora

### **Especificaciones Técnicas:**
- **Ancho de papel**: 57mm
- **Densidad de impresión**: 384 puntos por línea (203 DPI)
- **Comando de impresión**: EPSON ESC/POS compatible
- **Tipo de impresión**: Térmica directa
- **Colores**: Blanco y negro únicamente (sin grises)

---

## ⚙️ Configuración del Sistema

### **1. Características del Diseño de Tickets:**

✅ **Optimizado para impresoras POS térmicas de 57mm**
- Sin backgrounds de colores
- Solo texto negro sobre fondo blanco
- Sin imágenes complejas ni gradientes
- Fuente monoespaciada (Courier New)
- Bordes simples (sólidos y punteados)

✅ **Elementos del ticket:**
- Header con nombre del negocio y NIT
- Tipo de ticket (ENTRADA/SALIDA)
- Información del vehículo (placa, tipo)
- Fechas y horas
- Código de barras en texto
- Total a pagar (si aplica)
- Footer con información de contacto

---

## 🔧 Configuración en Windows

### **Paso 1: Instalar el Driver de la Impresora**

1. Conectar la impresora POS al puerto USB
2. Windows detectará automáticamente el dispositivo
3. Si no instala automáticamente:
   - Ir a **Panel de Control** → **Dispositivos e impresoras**
   - Click derecho → **Agregar impresora**
   - Seleccionar el modelo de tu impresora POS

### **Paso 2: Configurar las Propiedades de la Impresora**

1. Abrir **Dispositivos e impresoras**
2. Click derecho en tu impresora POS → **Propiedades de impresora**
3. Ir a la pestaña **Preferencias**
4. Configurar:
   - **Tamaño de papel**: Personalizado → 57mm x 297mm (o "Rollo")
   - **Orientación**: Vertical
   - **Calidad**: Alta (203 DPI)
   - **Modo de color**: Blanco y negro
   - **Ahorro de tinta**: Desactivado

### **Paso 3: Configuración Avanzada**

En **Propiedades de impresora** → **Opciones avanzadas**:
- **Tamaño de papel**: 57mm x Continuo
- **Escala**: 100%
- **Corte automático**: Activado (si la impresora lo soporta)

---

## 🖨️ Configuración en el Navegador

### **Google Chrome:**

1. Al imprimir, hacer clic en **Más configuraciones**
2. Configurar:
   - **Diseño**: Vertical
   - **Papel**: Personalizado → 57mm ancho
   - **Márgenes**: Ninguno
   - **Opciones**: 
     - ✅ Gráficos de fondo (desactivar)
     - ✅ Encabezados y pies de página (desactivar)
   - **Escala**: 100%

### **Microsoft Edge:**

1. Configuración de impresión similar a Chrome
2. Asegurarse de seleccionar **Sin márgenes**
3. Desactivar **Gráficos de fondo**

---

## 📐 Dimensiones del Ticket

```
Ancho papel:  57mm
Ancho útil:   51mm (con márgenes de 3mm)
Altura:       Variable (automática)

Márgenes:
  Superior:   2mm
  Inferior:   2mm
  Izquierdo:  3mm
  Derecho:    3mm
```

---

## 🎨 Diseño sin Colores

### **Elementos visuales permitidos:**

✅ **SÍ usar:**
- Texto negro sobre fondo blanco
- Bordes sólidos negros (1px, 2px, 3px)
- Bordes punteados negros (dashed)
- Bordes dobles (double border)
- Negritas y cursivas
- Espaciado y separadores

❌ **NO usar:**
- Colores (rojo, azul, verde, etc.)
- Gradientes
- Sombras (box-shadow, text-shadow)
- Backgrounds de colores
- Border-radius (opcional, puede causar problemas)
- Imágenes complejas

---

## 🔍 Código de Barras

El sistema genera un código de barras en formato **texto ASCII** compatible con impresoras térmicas:

```
||||  ||  ||||  ||  ||  ||||  ||  ||||
        ABC123XYZ789
```

**Características:**
- Altura: 12mm
- Ancho: 100% del ticket
- Texto legible debajo del código
- Solo caracteres ASCII simples

---

## 💡 Solución de Problemas

### **Problema: El ticket se imprime con colores o backgrounds**

**Solución:**
1. Verificar que la impresora esté configurada en modo B/N
2. En el navegador, desactivar "Gráficos de fondo"
3. Verificar que el CSS tenga `background: white !important`

### **Problema: El texto se sale del papel**

**Solución:**
1. Verificar que el ancho del papel esté configurado en 57mm
2. Reducir los márgenes a 2-3mm
3. Verificar la escala (debe ser 100%)

### **Problema: La impresora no corta el papel automáticamente**

**Solución:**
1. Verificar si la impresora tiene función de corte automático
2. Configurar en las propiedades de la impresora
3. Si no tiene, cortar manualmente

### **Problema: El código de barras no se lee**

**Solución:**
1. El código en texto es solo visual, no es escaneable
2. Para código escaneable, necesitas una librería de generación de códigos de barras reales
3. Alternativa: Usar el número del ticket directamente

### **Problema: Imprime muy claro o muy oscuro**

**Solución:**
1. Ajustar la temperatura de la impresora térmica
2. Verificar que el papel térmico sea de buena calidad
3. Limpiar el cabezal de impresión

---

## 📋 Checklist de Verificación

Antes de imprimir, verificar:

- [ ] Impresora configurada en 57mm
- [ ] Modo blanco y negro activado
- [ ] Sin márgenes o márgenes mínimos (2-3mm)
- [ ] Escala al 100%
- [ ] Gráficos de fondo desactivados
- [ ] Papel térmico cargado correctamente
- [ ] Impresora conectada y en línea

---

## 🔧 Comandos ESC/POS Básicos (Opcional)

Si deseas enviar comandos directos a la impresora:

```javascript
// Inicializar impresora
ESC + "@"  // Reset

// Texto normal
ESC + "!" + 0x00

// Texto en negrita
ESC + "!" + 0x08

// Texto doble altura
ESC + "!" + 0x10

// Alinear centro
ESC + "a" + 0x01

// Alinear izquierda
ESC + "a" + 0x00

// Cortar papel
GS + "V" + 0x00
```

**Nota:** El sistema actual usa HTML/CSS para imprimir, compatible con la mayoría de impresoras POS modernas.

---

## 📞 Soporte

Si tienes problemas con la impresión:

1. Verificar que tu impresora sea compatible con ESC/POS
2. Consultar el manual de tu impresora específica
3. Verificar drivers actualizados
4. Probar con otro navegador (Chrome recomendado)

---

## 📄 Archivos Relacionados

- `PrintFallback.tsx` - Componente principal de impresión
- `ThermalParkingTicket.tsx` - Componente de ticket térmico
- `thermal-receipt.css` - Estilos para impresión térmica
- Esta guía: `PRINTER-SETUP.md`

---

**Versión del sistema**: 2.0  
**Última actualización**: Octubre 2025  
**Compatible con**: Impresoras térmicas POS 57mm ESC/POS
