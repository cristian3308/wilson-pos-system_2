# 🚗 Wilson POS System - Sistema Profesional de Parqueadero y Lavadero

![Wilson POS](https://img.shields.io/badge/Wilson%20POS-v1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)

---

## 📋 Descripción

**Sistema integral de gestión para parqueaderos y lavaderos de vehículos con interfaz moderna, base de datos local y funcionalidades avanzadas.**

Desarrollado con tecnologías web modernas, arquitectura cliente-servidor, diseño responsive y operación en tiempo real.

---

## 🏗️ Arquitectura del Proyecto

```
pos-web-professional/
├── 📱 frontend/                 # React + Next.js + TypeScript + Tailwind
├── 🔧 backend/                  # Node.js + Express + SQLite
├── 🚀 install.bat               # Instalación automática
├── 🎯 start-dev.bat             # Inicio automático con Chrome
├── 📘 SETUP.md                  # Guía de instalación completa
├── 📗 GITHUB-GUIDE.md           # Guía para subir a GitHub
└── 📄 README.md                 # Este archivo
```

---

## 🌟 Características Principales

### 🚗 **Sistema de Parqueadero**
- ✅ Ingreso y egreso automatizado de vehículos
- ✅ Cálculo automático de tiempo y tarifas
- ✅ Control de espacios disponibles
- ✅ **Tipos de vehículos personalizados** (Carro, Moto, Camión, + Custom)
- ✅ Historial completo de transacciones

### 🧼 **Sistema de Lavadero**
- ✅ Gestión de servicios de lavado
- ✅ Control de vehículos en proceso
- ✅ Facturación integrada

### 📊 **Dashboard y Reportes**
- ✅ Estadísticas en tiempo real
- ✅ Gráficos de ingresos diarios/mensuales
- ✅ Reportes exportables

### 🖨️ **Sistema de Impresión**
- ✅ Tickets térmicos automáticos
- ✅ Formato profesional con logo
- ✅ Soporte para impresoras térmicas 80mm

### ⚙️ **Configuración**
- ✅ Panel de administración completo
- ✅ Gestión de tarifas
- ✅ Tipos de vehículos personalizados
- ✅ Configuración de negocio

---

## 🚀 Instalación Rápida (Windows)

### **Opción 1: Instalación Automática** ⚡

1. **Clonar o descargar el proyecto**
   ```powershell
   git clone https://github.com/TU-USUARIO/wilson-pos-system.git
   cd wilson-pos-system
   ```

2. **Instalar dependencias** (ejecutar como Administrador)
   ```powershell
   .\install.bat
   ```

3. **Iniciar el sistema**
   ```powershell
   .\start-dev.bat
   ```
   
   ✅ Se abrirá automáticamente Chrome en `http://localhost:3000`

---

### **Opción 2: Instalación Manual** 🔧

#### **Requisitos**
- Node.js 18+ → [Descargar](https://nodejs.org/)
- npm 9+ (incluido con Node.js)
- Windows 10/11

#### **Pasos**

1. **Instalar Backend**
   ```powershell
   cd backend
   npm install
   ```

2. **Instalar Frontend**
   ```powershell
   cd ../frontend
   npm install
   ```

3. **Ejecutar Backend** (en una terminal)
   ```powershell
   cd backend
   npm run dev
   ```

4. **Ejecutar Frontend** (en otra terminal)
   ```powershell
   cd frontend
   npm run dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

---

## 📦 Tecnologías Utilizadas

### **Frontend**
- ⚛️ **React 18** - Biblioteca UI
- 🔷 **Next.js 14** - Framework React con SSR
- 📘 **TypeScript 5** - Tipado estático
- 🎨 **Tailwind CSS** - Estilos utility-first
- 🌀 **Framer Motion** - Animaciones
- 💾 **IndexedDB** - Base de datos local del navegador

### **Backend**
- 🟢 **Node.js 18+** - Runtime JavaScript
- 🚂 **Express** - Framework web
- 🗄️ **SQLite** - Base de datos local
- 📘 **TypeScript** - Tipado estático
- 🔐 **JWT** - Autenticación

---

## 🎯 Uso del Sistema

### **1. Iniciar el Sistema**
```powershell
start-dev.bat
```

### **2. Acceder al Dashboard**
- URL: `http://localhost:3000`
- Usuario por defecto: `admin`
- Contraseña por defecto: `admin123`

### **3. Flujo de Trabajo - Parqueadero**

1. **Registrar Ingreso**
   - Clic en "Ingresar Vehículo"
   - Seleccionar tipo de vehículo
   - Ingresar placa (ej: `ABC123`)
   - Se genera ticket automáticamente

2. **Registrar Salida**
   - Buscar por placa
   - Sistema calcula tiempo y monto
   - Imprimir ticket de salida
   - Registrar pago

3. **Ver Estadísticas**
   - Dashboard principal muestra:
     - Vehículos actuales
     - Ingresos del día
     - Espacios disponibles
     - Gráficos de tendencias

### **4. Configuración de Tipos de Vehículos**

1. Ir a **Configuración** → **Tipos de Vehículos**
2. Clic en **"+ Agregar Tipo"**
3. Ingresar:
   - Nombre (ej: "Camioneta")
   - Tarifa por hora (ej: 3000)
   - Seleccionar icono
4. Guardar

---

## 📂 Estructura de Directorios

```
frontend/
├── src/
│   ├── app/                    # Páginas Next.js (App Router)
│   │   ├── page.tsx           # Dashboard principal
│   │   ├── admin/             # Panel administración
│   │   └── dashboard/         # Reportes
│   ├── components/            # Componentes React
│   │   ├── ImprovedParqueaderoManagement.tsx
│   │   ├── CarwashManagement.tsx
│   │   ├── PrintFallback.tsx
│   │   └── ...
│   ├── lib/                   # Utilidades y servicios
│   │   ├── localDatabase.ts   # IndexedDB wrapper
│   │   └── parkingSystem.ts   # Lógica de negocio
│   └── types/                 # Definiciones TypeScript

backend/
├── src/
│   ├── server.ts              # Punto de entrada
│   ├── controllers/           # Controladores API
│   ├── models/                # Modelos de datos
│   ├── routes/                # Rutas Express
│   ├── services/              # Lógica de negocio
│   └── database/              # SQLite DB
│       └── pos_system.db
```

---

## 🔧 Comandos Útiles

### **Backend**
```powershell
cd backend
npm run dev        # Modo desarrollo (puerto 3001)
npm run build      # Compilar TypeScript
npm start          # Producción
```

### **Frontend**
```powershell
cd frontend
npm run dev        # Modo desarrollo (puerto 3000)
npm run build      # Build de producción
npm start          # Servidor producción
```

---

## 🐛 Solución de Problemas

### **Error: "Port 3000 already in use"**
```powershell
# Cerrar procesos en puerto 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### **Error: "Cannot find module"**
```powershell
# Reinstalar dependencias
cd backend
rmdir /s /q node_modules
npm install

cd ../frontend
rmdir /s /q node_modules
npm install
```

### **Chrome no se abre automáticamente**
- Verificar ruta de Chrome en `start-dev.bat`
- Abrir manualmente: `http://localhost:3000`

### **Base de datos corrupta**
```powershell
# Eliminar y reinicializar
cd backend/database
del pos_system.db
cd ..
npm run init-db
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍� Autor

**Wilson Cars & Wash**
- Sistema desarrollado para gestión profesional de parqueaderos y lavaderos

---

## 📚 Documentación Adicional

- 📘 **[SETUP.md](SETUP.md)** - Guía completa de instalación con troubleshooting
- � **[GITHUB-GUIDE.md](GITHUB-GUIDE.md)** - Cómo subir y clonar desde GitHub
- 📄 **[COMANDOS-GITHUB.txt](COMANDOS-GITHUB.txt)** - Comandos rápidos para Git

---

## 🎉 ¡Gracias por usar Wilson POS System!

Si tienes problemas o sugerencias, no dudes en abrir un **Issue** en GitHub.

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025

- ✅ Gestión de tarifas personalizables

- ✅ Ingreso y egreso automatizado de vehículos├── 📄 docs/                     # Documentación

### 🧽 **Sistema de Lavadero**

- ✅ Gestión de órdenes de lavado- ✅ Cálculo automático de tiempo y tarifas└── 🧪 tests/                    # Tests automatizados

- ✅ Diferentes tipos de servicios

- ✅ Control de estado de órdenes- ✅ Códigos de barras únicos para cada ticket```

- ✅ Facturación integrada

- ✅ Impresión térmica de tickets profesionales

### 📊 **Dashboard y Reportes**

- ✅ Estadísticas en tiempo real- ✅ Soporte para Carros, Motos y Camiones## 🚀 Tecnologías Utilizadas

- ✅ Gráficos interactivos

- ✅ Reportes de ingresos- ✅ Gestión de espacios disponibles

- ✅ Panel de administración

### Frontend

### 🎨 **Interfaz Moderna**

- ✅ Diseño responsive (móvil, tablet, desktop)### 🧽 **Sistema de Lavadero**- **React 18** con TypeScript

- ✅ Tema oscuro/claro

- ✅ Animaciones fluidas- ✅ Gestión completa de órdenes de lavado- **Next.js 14** para SSR y optimización

- ✅ Componentes reutilizables

- ✅ Servicios configurables (Básico, Premium, Encerado, etc.)- **Tailwind CSS** para estilos modernos

## 🚀 Instalación y Uso

- ✅ Control de estados (Pendiente, En Proceso, Completado)- **Zustand** para estado global

### Prerrequisitos

- Node.js 18+- ✅ Facturación integrada con desglose detallado- **React Query** para manejo de datos

- npm o yarn

- ✅ Asignación de trabajadores- **Chart.js/D3.js** para visualizaciones

### Instalación

```bash- ✅ Tiempo estimado de servicios- **Socket.IO Client** para tiempo real

# Clonar el repositorio

git clone https://github.com/cristian3308/wilson-pos-system.git- **React Hook Form** para formularios



# Instalar dependencias### 🗄️ **Base de Datos Local**- **Framer Motion** para animaciones

npm install

- ✅ SQLite integrado (sin servidor externo)

# Iniciar la aplicación

npm run dev- ✅ CRUD completo para todos los módulos### Backend

```

- ✅ Exportación a Excel/CSV- **Node.js** con TypeScript

### Acceso

- **Frontend**: http://localhost:3000- ✅ Filtros avanzados por fecha, estado, tipo- **Express.js** con arquitectura en capas

- **Backend**: http://localhost:5000

- **Usuario**: admin- ✅ Respaldo automático de datos- **MongoDB** con Mongoose ODM

- **Contraseña**: admin123

- ✅ Estadísticas en tiempo real- **JWT** para autenticación

## 💻 Tecnologías

- **Socket.IO** para WebSockets

### Frontend

- **React 18** - Biblioteca de UI### ⚙️ **Panel de Administración**- **Joi** para validaciones

- **Next.js 14** - Framework de React

- **TypeScript** - Tipado estático- ✅ Configuración de precios dinámicos- **Winston** para logging

- **Tailwind CSS** - Framework de CSS

- **Framer Motion** - Animaciones- ✅ Gestión de datos del negocio- **Jest** para testing



### Backend- ✅ Usuarios y permisos- **Helmet** para seguridad

- **Node.js** - Runtime de JavaScript

- **Express.js** - Framework web- ✅ Reportes detallados

- **SQLite** - Base de datos local

- **Socket.io** - Comunicación en tiempo real- ✅ Dashboard con métricas importantes### DevOps & Tools



## 📱 Características Técnicas- **Docker & Docker Compose**



- 🎯 **SPA (Single Page Application)**### 🎨 **Interfaz Moderna**- **GitHub Actions** para CI/CD

- 🔄 **Actualizaciones en tiempo real**

- 📱 **Diseño responsive**- ✅ Diseño responsivo y profesional- **ESLint & Prettier** para calidad de código

- 🗄️ **Base de datos local SQLite**

- 🔐 **Sistema de autenticación**- ✅ Gradientes y animaciones fluidas- **Husky** para git hooks

- 🖨️ **Generación de tickets**

- 📊 **Dashboard con métricas**- ✅ Iconos intuitivos- **Swagger** para documentación API



## 🤝 Contribución- ✅ Optimizado para pantallas táctiles



1. Fork el proyecto## 🎯 Características Principales

2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)

3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)## 🚀 Instalación Rápida

4. Push a la rama (`git push origin feature/AmazingFeature`)

5. Abre un Pull Request### 🅿️ Sistema de Parqueadero



## 📄 Licencia### 📋 **Requisitos del Sistema**- Gestión de espacios en tiempo real



Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.- Windows 10 o superior (64-bit)- Códigos QR/Barras para tickets



## 👨‍💻 Autor- 4GB RAM mínimo- Cámaras de seguridad integradas



**Ingeniero de Sistemas Senior**- 500MB espacio libre en disco- Pagos digitales (Stripe/PayPal)

- GitHub: [@cristian3308](https://github.com/cristian3308)

- **NO requiere Node.js en el equipo destino**- Notificaciones push automáticas

---

- Sistema de reservas

⭐ ¡Dale una estrella al proyecto si te ha sido útil!
### 💻 **Para Desarrolladores**

```bash### 🚿 Sistema de Lavadero

# Clonar el repositorio- Cola de servicios inteligente

git clone https://github.com/cristian3308/wilson-pos-system.git- Asignación automática de trabajadores

cd wilson-pos-system- Galería antes/después

- Seguimiento de progreso en vivo

# Instalar dependencias- Gestión de productos químicos

npm run setup- Facturación automática



# Modo desarrollo### 📊 Dashboard Analytics

npm run dev- Métricas en tiempo real

- Gráficos interactivos

# Compilar para producción- Reportes personalizables

npm run build- Análisis predictivo con IA

- Exportación PDF/Excel

# Crear ejecutable- KPIs de negocio

npm run package

```### 👥 Gestión de Personal

- Roles y permisos granulares

### 🎯 **Para Usuarios Finales**- Seguimiento de comisiones

- Horarios y turnos

#### **Opción 1: Ejecutable Automático (RECOMENDADO)**- Evaluación de desempeño

```bash- Chat interno

1. Descargar: EMPAQUETADO-COMPLETO.bat- Notificaciones móviles

2. Ejecutar como Administrador

3. Esperar 3-5 minutos## 🔐 Seguridad

4. ¡Listo! Se crea Wilson POS System.exe

```- Autenticación JWT con refresh tokens

- Autorización basada en roles (RBAC)

#### **Opción 2: Instalador Completo**- Encriptación de datos sensibles

```bash- Rate limiting y DDoS protection

1. Descargar: Wilson POS System Setup.exe- Auditoría de acciones

2. Ejecutar como Administrador  - Backup automático de datos

3. Seguir asistente de instalación

4. Icono automático en escritorio## 📱 Responsive Design

```

- Mobile-first approach

#### **Opción 3: Versión Portable**- PWA (Progressive Web App)

```bash- Offline functionality

1. Descargar: carpeta dist/ completa- Touch-friendly interfaces

2. Ejecutar: Wilson POS System.exe- Adaptive layouts

3. ¡Funciona inmediatamente!- Dark/Light theme

```

## 🔄 Tiempo Real

## 📁 Estructura del Proyecto

- Updates instantáneos de estado

```- Chat en vivo

wilson-pos-system/- Notificaciones push

├── 📁 backend/                 # Servidor Node.js + Express- Sincronización automática

│   ├── 📁 src/- Heartbeat monitoring

│   │   ├── 📁 controllers/     # Lógica de negocio- Reconnection automática

│   │   ├── 📁 models/          # Modelos de datos

│   │   ├── 📁 routes/          # Rutas API REST## ⚡ Performance

│   │   ├── 📁 services/        # Servicios

│   │   └── 📄 server.ts        # Punto de entrada- Code splitting automático

│   ├── 📁 database/           # Base de datos SQLite- Lazy loading de componentes

│   └── 📄 package.json- Image optimization

├── 📁 frontend/               # Interfaz React + TypeScript- CDN integration

│   ├── 📁 src/- Database indexing

│   │   ├── 📁 components/     # Componentes React- Caching strategies

│   │   ├── 📁 lib/           # Utilidades y servicios

│   │   ├── 📁 contexts/      # Contextos React## 🧪 Testing

│   │   └── 📁 app/           # Pages Next.js

│   └── 📄 package.json- Unit tests (Jest)

├── 📄 main.js                # Proceso principal Electron- Integration tests

├── 📄 electron-builder.yml   # Configuración empaquetado- E2E tests (Playwright)

├── 📄 EMPAQUETADO-COMPLETO.bat # Script automático- API testing (Supertest)

└── 📄 package.json          # Configuración principal- Coverage reports

```- Automated testing pipeline



## 🔧 Scripts Disponibles## 📈 Monitoreo



### 🏃 **Desarrollo**- Application monitoring

```bash- Error tracking (Sentry)

npm run dev              # Ejecutar en modo desarrollo- Performance metrics

npm run dev:backend      # Solo backend- User analytics

npm run dev:frontend     # Solo frontend- Health checks

npm run electron-dev     # Electron + desarrollo- Alerting system

```

---

### 🏗️ **Construcción**

```bash> **Desarrollado por:** Ingeniero de Sistemas Senior  

npm run build            # Compilar todo> **Experiencia:** 7+ años en desarrollo full-stack  

npm run build:backend    # Solo backend> **Arquitectura:** Microservicios escalables  

npm run build:frontend   # Solo frontend + export> **Calidad:** Enterprise-grade code  
```

### 📦 **Empaquetado**
```bash
npm run package         # Crear ejecutable
npm run package:win     # Ejecutable Windows
npm run package:portable # Versión portable
npm run dist           # Distribución completa
```

### 🧪 **Testing y Calidad**
```bash
npm test               # Ejecutar todos los tests
npm run lint           # Linter código
npm run typecheck      # Verificar tipos TypeScript
```

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- ⚛️ **React 18** - Librería UI moderna
- 📘 **TypeScript 5** - Tipado estático
- ⚡ **Next.js 14** - Framework React
- 🎨 **Tailwind CSS** - Estilos utilitarios

### **Backend**
- 🟢 **Node.js 18+** - Runtime JavaScript
- 🚀 **Express.js** - Framework web
- 📘 **TypeScript** - Tipado estático
- 🗄️ **SQLite** - Base de datos local

### **Desktop**
- ⚡ **Electron 27** - Aplicación escritorio
- 📦 **Electron Builder** - Empaquetado

### **DevOps & Tools**
- 📊 **ESLint + Prettier** - Calidad código
- 🧪 **Jest** - Testing framework
- 🔧 **Concurrently** - Scripts paralelos

## 🔐 Seguridad y Datos

- 🔒 **Datos 100% locales** - Sin conexión a internet requerida
- 🛡️ **Encriptación SQLite** - Base de datos protegida
- 💾 **Respaldos automáticos** - Datos seguros
- 📋 **Auditoría completa** - Log de todas las operaciones

## 📞 **Soporte Técnico**
- 📧 **Email**: soporte@wilsonpos.com
- 📱 **WhatsApp**: +57 300 123 4567

### 📚 **Documentación**
- 📖 [Manual de Usuario Completo](MANUAL-USO-RAPIDO.md)
- 🔧 [Guía de Instalación](INSTRUCCIONES-INSTALACION.md)
- 📦 [Guía de Distribución](LEEME-DISTRIBUCION.md)

---

<div align="center">

### ⭐ ¡Dale una estrella si este proyecto te ayudó! ⭐

**Wilson POS System - Transformando la gestión de parqueaderos y lavaderos** 🚗💎

</div>