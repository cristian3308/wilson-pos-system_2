# 🖥️ GUÍA PASO A PASO: INSTALAR EN OTRO COMPUTADOR

## 📋 REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener instalado:
- ✅ **Node.js** (versión 16 o superior)
- ✅ **Git** (para descargar el código)
- ✅ **Editor de código** (VS Code recomendado)

---

## 🚀 PASO 1: DESCARGAR NODE.JS (si no lo tienes)

### Windows:
1. Ve a: https://nodejs.org/
2. Descarga la versión **LTS** (recomendada)
3. Ejecuta el instalador
4. Haz clic en "Next" hasta que termine
5. **Verifica la instalación:**
   ```cmd
   node --version
   npm --version
   ```
   Deberías ver algo como:
   ```
   v18.17.0
   9.8.1
   ```

---

## 🔧 PASO 2: INSTALAR GIT (si no lo tienes)

### Windows:
1. Ve a: https://git-scm.com/download/win
2. Descarga el instalador
3. Ejecuta el instalador
4. Deja todas las opciones por defecto
5. **Verifica la instalación:**
   ```cmd
   git --version
   ```
   Deberías ver algo como: `git version 2.41.0.windows.1`

---

## 📥 PASO 3: DESCARGAR EL PROYECTO DE GITHUB

### Opción A: Clonar con Git (Recomendado)

1. **Abre PowerShell o CMD**
   - Presiona `Windows + R`
   - Escribe `powershell`
   - Presiona Enter

2. **Ve a la carpeta donde quieres guardar el proyecto:**
   ```powershell
   cd C:\Users\TU_USUARIO\Desktop
   ```
   *(Cambia `TU_USUARIO` por tu nombre de usuario)*

3. **Clona el repositorio:**
   ```powershell
   git clone https://github.com/cristian3308/wilson-pos-system_2.git
   ```
   
4. **Entra a la carpeta del proyecto:**
   ```powershell
   cd wilson-pos-system_2
   ```

### Opción B: Descargar ZIP (Sin Git)

1. Ve a: https://github.com/cristian3308/wilson-pos-system_2
2. Haz clic en el botón verde **"Code"**
3. Selecciona **"Download ZIP"**
4. Descarga el archivo
5. Descomprime el ZIP en tu escritorio o donde prefieras
6. Abre PowerShell en esa carpeta:
   - Mantén presionado `Shift`
   - Haz clic derecho en la carpeta
   - Selecciona **"Abrir ventana de PowerShell aquí"**

---

## 📦 PASO 4: INSTALAR DEPENDENCIAS

### 4.1. Instalar Dependencias del Backend

1. **Entra a la carpeta backend:**
   ```powershell
   cd backend
   ```

2. **Instala las dependencias:**
   ```powershell
   npm install
   ```
   
   Esto descargará todas las librerías necesarias (puede tardar 2-5 minutos).
   
   Verás algo como:
   ```
   added 245 packages, and audited 246 packages in 2m
   ```

3. **Vuelve a la raíz del proyecto:**
   ```powershell
   cd ..
   ```

### 4.2. Instalar Dependencias del Frontend

1. **Entra a la carpeta frontend:**
   ```powershell
   cd frontend
   ```

2. **Instala las dependencias:**
   ```powershell
   npm install
   ```
   
   Esto también tardará 2-5 minutos.

3. **Vuelve a la raíz del proyecto:**
   ```powershell
   cd ..
   ```

### 4.3. Instalar Dependencias del Proyecto Principal

1. **En la raíz del proyecto, instala:**
   ```powershell
   npm install
   ```

---

## 🗄️ PASO 5: INICIALIZAR LA BASE DE DATOS

La base de datos SQLite necesita ser inicializada con la tabla de cierres de caja.

### Opción A: Script Automático (Windows)

```powershell
.\init-database-v2.bat
```

### Opción B: Script Manual

```powershell
node setup-database.js
```

### Opción C: Paso a Paso

1. **Crear la tabla manualmente:**
   ```powershell
   node backend/create-cash-closures.js
   ```

2. **Verificar que se creó correctamente:**
   ```powershell
   node backend/check-tables.js
   ```

**Deberías ver:**
```
✅ Base de datos encontrada
📋 Tablas en la base de datos: 9
   - cash_closures ✅
   - empresa_config
   - espacios_parqueadero
   - ...
```

---

## ▶️ PASO 6: INICIAR EL SISTEMA

Ahora que todo está instalado, vamos a iniciar el servidor.

### Opción A: Iniciar Ambos Servidores (Recomendado)

En la **raíz del proyecto**, ejecuta:

```powershell
npm run dev
```

Esto iniciará:
- 🟢 **Backend** en http://localhost:5000
- 🔵 **Frontend** en http://localhost:3000

Verás algo como:
```
[0] 🚀 Server running in development mode on port 5000
[1] ▲ Next.js 14.0.4
[1] - Local: http://localhost:3000
```

### Opción B: Iniciar Solo el Backend

```powershell
cd backend
npm run dev
```

### Opción C: Iniciar Solo el Frontend

```powershell
cd frontend
npm run dev
```

---

## 🌐 PASO 7: ABRIR EL SISTEMA EN EL NAVEGADOR

1. **Abre tu navegador favorito** (Chrome, Edge, Firefox)

2. **Ve a la dirección:**
   ```
   http://localhost:3000
   ```

3. **¡Listo!** Deberías ver el dashboard del sistema POS

---

## ✅ VERIFICACIÓN: ¿TODO FUNCIONA?

### Checklist de Verificación:

- [ ] ¿Se ve el dashboard principal?
- [ ] ¿Aparecen las métricas (Ingresos, Vehículos, etc.)?
- [ ] ¿Funciona el botón "Cierre de Caja"?
- [ ] ¿Puedes ver "Ver Cierres Guardados"?
- [ ] ¿Al hacer un cierre, se guarda correctamente?
- [ ] ¿Puedes ver cierres anteriores en el selector?

---

## 🔍 UBICACIÓN DE LA BASE DE DATOS

La base de datos se encuentra en:
```
C:\Users\TU_USUARIO\...\wilson-pos-system_2\backend\dist\database\pos_system.db
```

Para ver la ubicación exacta:
1. Inicia el backend (`npm run dev`)
2. Busca en la consola el mensaje:
   ```
   📁 BASE DE DATOS DE CIERRES DE CAJA:
      C:\Ruta\Completa\al\archivo\pos_system.db
   ```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS COMUNES

### ❌ Error: "npm no se reconoce como comando"
**Solución:** Node.js no está instalado o no está en el PATH.
1. Reinstala Node.js desde https://nodejs.org/
2. Reinicia la terminal
3. Verifica con `node --version`

### ❌ Error: "Cannot find module 'sqlite3'"
**Solución:** Las dependencias no se instalaron correctamente.
```powershell
cd backend
npm install sqlite3 --save
npm install
```

### ❌ Error: "Puerto 3000 ya está en uso"
**Solución:** Otro proceso está usando el puerto.
```powershell
# Opción 1: Cerrar el proceso que usa el puerto
npx kill-port 3000

# Opción 2: Usar otro puerto
# En frontend/.env.local:
PORT=3001
```

### ❌ Error: "Puerto 5000 ya está en uso"
**Solución:**
```powershell
# Cerrar el proceso
npx kill-port 5000

# O cambiar el puerto en backend/src/server.ts
```

### ❌ Error: "La base de datos no existe"
**Solución:** Inicializar la base de datos.
```powershell
node setup-database.js
```

### ❌ Error: "cash_closures table doesn't exist"
**Solución:** Crear la tabla manualmente.
```powershell
node backend/create-cash-closures.js
```

### ❌ La página se queda en blanco
**Solución:**
1. Verifica que el backend esté corriendo en http://localhost:5000
2. Abre las herramientas de desarrollador (F12)
3. Revisa la consola en busca de errores
4. Reinicia ambos servidores

---

## 🔄 ACTUALIZACIONES FUTURAS

Cuando haya cambios nuevos en GitHub:

```powershell
# 1. Detener los servidores (Ctrl + C)

# 2. Descargar los cambios
git pull origin main

# 3. Actualizar dependencias
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 4. Reiniciar el sistema
npm run dev
```

---

## 📱 ACCESO DESDE OTROS DISPOSITIVOS

Para acceder desde tu celular o tablet en la misma red:

1. **Encuentra tu IP local:**
   ```powershell
   ipconfig
   ```
   Busca "Dirección IPv4" (ej: 192.168.1.100)

2. **En frontend/package.json, cambia el comando dev:**
   ```json
   "dev": "next dev -H 0.0.0.0"
   ```

3. **Reinicia el frontend**

4. **Desde otro dispositivo, abre:**
   ```
   http://192.168.1.100:3000
   ```
   *(Usa tu IP real)*

---

## 🎓 COMANDOS ÚTILES

### Ver todos los procesos de Node.js:
```powershell
Get-Process node
```

### Matar todos los procesos de Node.js:
```powershell
Stop-Process -Name node -Force
```

### Limpiar caché de npm:
```powershell
npm cache clean --force
```

### Reinstalar todo desde cero:
```powershell
# Eliminar node_modules
Remove-Item -Recurse -Force node_modules, backend/node_modules, frontend/node_modules

# Reinstalar
npm install
cd backend && npm install
cd ../frontend && npm install
```

---

## 📞 SOPORTE

Si tienes algún problema:
1. Revisa la sección "Solución de Problemas"
2. Lee los archivos de documentación en el proyecto:
   - `INICIALIZAR-BASE-DATOS.md`
   - `UBICACION-BASE-DATOS.md`
   - `CAMBIOS-CIERRES-IMPLEMENTADOS.md`
3. Busca el error en Google
4. Revisa los logs en la consola

---

## 📝 RESUMEN RÁPIDO

```powershell
# 1. Clonar
git clone https://github.com/cristian3308/wilson-pos-system_2.git
cd wilson-pos-system_2

# 2. Instalar dependencias
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Inicializar base de datos
node setup-database.js

# 4. Iniciar todo
npm run dev

# 5. Abrir navegador
# http://localhost:3000
```

---

**¡Eso es todo!** 🎉

Tu sistema POS está listo para usar en el nuevo computador.

---

**Fecha:** 13 de Octubre, 2025  
**Versión del Sistema:** 2.0  
**Última actualización GitHub:** Commit 841e4d8
