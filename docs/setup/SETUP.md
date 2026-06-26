# 🚀 Guía de Instalación - Wilson POS System

Esta guía te ayudará a instalar y ejecutar el sistema POS en otro computador desde cero.

## 📋 Requisitos Previos

Antes de comenzar, necesitas tener instalado:

### 1. Node.js (versión 18 o superior)
- **Descargar**: https://nodejs.org/
- **Versión recomendada**: LTS (Long Term Support)
- **Verificar instalación**:
  ```bash
  node -v
  # Debería mostrar: v18.x.x o superior
  ```

### 2. npm (viene con Node.js)
- **Verificar instalación**:
  ```bash
  npm -v
  # Debería mostrar: 9.x.x o superior
  ```

### 3. Git (opcional, pero recomendado)
- **Descargar**: https://git-scm.com/
- **Verificar instalación**:
  ```bash
  git --version
  ```

---

## 📦 Instalación del Proyecto

### Opción 1: Copiar todo el proyecto (Recomendado)

1. **Copiar la carpeta completa del proyecto** a la nueva computadora
   - Incluye TODA la carpeta `pos-web-professional`
   - NO copies la carpeta `node_modules` (es muy pesada y se regenera)

2. **Abrir PowerShell o CMD** en la carpeta del proyecto
   ```powershell
   cd ruta\donde\copiaste\pos-web-professional
   ```

3. **Instalar dependencias del Backend**
   ```powershell
   cd backend
   npm install
   cd ..
   ```

4. **Instalar dependencias del Frontend**
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

### Opción 2: Clonar desde GitHub (Si tienes el repositorio)

```bash
git clone https://github.com/cristian3308/wilson-pos-system.git
cd wilson-pos-system
```

Luego sigue los pasos 3 y 4 de la Opción 1.

---

## 🏃 Ejecutar el Proyecto

### Método 1: Desarrollo (Recomendado para pruebas)

Necesitas **DOS terminales abiertas**:

#### Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```
- El backend se ejecutará en: `http://localhost:3001`
- Verás: `✓ Servidor corriendo en http://localhost:3001`

#### Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
```
- El frontend se ejecutará en: `http://localhost:3000`
- Verás: `✓ Ready in [tiempo]`
- Abrirá automáticamente en el navegador

### Método 2: Producción (Para uso real)

1. **Compilar el Frontend**:
   ```powershell
   cd frontend
   npm run build
   cd ..
   ```

2. **Ejecutar el Backend en producción**:
   ```powershell
   cd backend
   npm start
   ```

3. **Abrir el navegador en**: `http://localhost:3001`

---

## 🔧 Solución de Problemas Comunes

### Error: "npm no se reconoce como comando"
**Solución**: Node.js no está instalado o no está en el PATH
1. Reinstala Node.js desde https://nodejs.org/
2. Reinicia la terminal después de instalar

### Error: "Cannot find module"
**Solución**: Las dependencias no están instaladas
```powershell
# En backend
cd backend
npm install

# En frontend
cd frontend
npm install
```

### Error: "Port 3000 is already in use"
**Solución**: El puerto está ocupado
- Cierra cualquier otra aplicación que use el puerto 3000
- O cambia el puerto en `frontend/package.json`:
  ```json
  "dev": "next dev -p 3002"
  ```

### Error: "Port 3001 is already in use"
**Solución**: El puerto del backend está ocupado
- Cierra cualquier otra aplicación que use el puerto 3001
- O cambia el puerto en `backend/src/server.ts`

### La aplicación se ve rota o sin estilos
**Solución**: 
1. Limpia la caché del navegador (Ctrl + Shift + Delete)
2. Reconstruye el frontend:
   ```powershell
   cd frontend
   npm run build
   npm run dev
   ```

### Error: "EACCES: permission denied"
**Solución**: Problemas de permisos
- En Windows: Ejecuta PowerShell como Administrador
- Limpia la caché de npm:
  ```powershell
  npm cache clean --force
  ```

---

## 📁 Estructura del Proyecto

```
pos-web-professional/
├── backend/                 # Servidor Node.js + Express
│   ├── src/
│   │   ├── server.ts       # Punto de entrada
│   │   ├── routes/         # Rutas de la API
│   │   ├── controllers/    # Lógica de negocio
│   │   └── database/       # Base de datos SQLite
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # Aplicación Next.js + React
│   ├── src/
│   │   ├── app/           # Páginas y rutas
│   │   ├── components/    # Componentes React
│   │   ├── lib/          # Utilidades y base de datos local
│   │   └── services/     # Servicios de API
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
│
├── SETUP.md              # Este archivo
└── README.md            # Documentación general
```

---

## 🎯 Acceder al Sistema

Una vez que todo esté corriendo:

1. **Abrir el navegador** en: `http://localhost:3000`

2. **Páginas disponibles**:
   - `/` - Dashboard principal
   - `/dashboard` - Dashboard con estadísticas
   - `/dashboard/parqueadero` - Gestión de parqueadero
   - `/dashboard/lavadero` - Gestión de lavadero
   - `/admin` - Panel de administración

3. **Datos iniciales**:
   - El sistema usa IndexedDB (base de datos local del navegador)
   - Los datos se guardan automáticamente
   - Puedes resetear los datos desde Admin > Database Manager

---

## 💾 Backup y Migración de Datos

### Exportar datos (desde la computadora actual):

1. Ir a **Admin** > **Database Manager**
2. Click en **"Exportar"**
3. Guardar el archivo JSON

### Importar datos (en la nueva computadora):

1. Ir a **Admin** > **Database Manager**
2. Click en **"Importar"**
3. Seleccionar el archivo JSON exportado

---

## 🔄 Actualizar el Proyecto

Si hay cambios nuevos en el código:

```powershell
# 1. Detener el servidor (Ctrl + C en ambas terminales)

# 2. Actualizar dependencias del backend
cd backend
npm install
cd ..

# 3. Actualizar dependencias del frontend
cd frontend
npm install
cd ..

# 4. Volver a ejecutar (ver sección "Ejecutar el Proyecto")
```

---

## 📞 Soporte

Si tienes problemas:

1. **Verifica que Node.js esté instalado correctamente**:
   ```bash
   node -v
   npm -v
   ```

2. **Revisa los logs en la terminal** - Los errores aparecerán ahí

3. **Limpia todo y reinstala**:
   ```powershell
   # Backend
   cd backend
   Remove-Item -Recurse -Force node_modules
   npm install
   cd ..

   # Frontend
   cd frontend
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Recurse -Force .next
   npm install
   cd ..
   ```

---

## ✅ Checklist de Instalación

- [ ] Node.js 18+ instalado
- [ ] npm funcionando
- [ ] Proyecto copiado/clonado
- [ ] Backend: `npm install` completado
- [ ] Frontend: `npm install` completado
- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 3000
- [ ] Aplicación accesible en el navegador
- [ ] Datos importados (si es necesario)

---

## 🎉 ¡Listo!

Tu sistema POS debería estar funcionando correctamente. 

**Comandos rápidos para recordar**:

```powershell
# Backend
cd backend && npm run dev

# Frontend (en otra terminal)
cd frontend && npm run dev
```

**URLs importantes**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Dashboard: http://localhost:3000/dashboard
