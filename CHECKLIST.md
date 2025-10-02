# ✅ CHECKLIST - Copiar Proyecto a Otra Computadora

## 📋 Antes de Copiar

- [ ] Verifica que el proyecto funcione correctamente en esta PC
- [ ] Cierra Visual Studio Code y todas las terminales
- [ ] Detén el backend y frontend (Ctrl+C)

---

## 📦 Archivos y Carpetas a COPIAR

### ✅ COPIAR TODO:

- [ ] 📁 `backend/` (excepto `node_modules/`)
  - [ ] `backend/src/`
  - [ ] `backend/database/`
  - [ ] `backend/package.json`
  - [ ] `backend/tsconfig.json`
  - [ ] `backend/logs/`

- [ ] 📁 `frontend/` (excepto `node_modules/` y `.next/`)
  - [ ] `frontend/src/`
  - [ ] `frontend/public/`
  - [ ] `frontend/package.json`
  - [ ] `frontend/tsconfig.json`
  - [ ] `frontend/next.config.js`
  - [ ] `frontend/tailwind.config.js`
  - [ ] `frontend/postcss.config.js`

- [ ] 📄 Archivos en la raíz:
  - [ ] `install.bat`
  - [ ] `start-dev.bat`
  - [ ] `SETUP.md`
  - [ ] `README.md`
  - [ ] `LICENSE`
  - [ ] `package.json` (si existe)

### ❌ NO COPIAR (se regeneran automáticamente):

- [ ] ❌ `backend/node_modules/` ← MUY PESADO, se reinstala
- [ ] ❌ `frontend/node_modules/` ← MUY PESADO, se reinstala
- [ ] ❌ `frontend/.next/` ← Se regenera al compilar
- [ ] ❌ `.git/` ← Solo si no necesitas el historial de Git

---

## 💻 En la NUEVA Computadora

### Paso 1: Verificar Requisitos

- [ ] Windows 10/11
- [ ] Node.js instalado (https://nodejs.org/)
  - [ ] Ejecutar: `node -v` → Debe mostrar v18.x.x o superior
  - [ ] Ejecutar: `npm -v` → Debe mostrar 9.x.x o superior

### Paso 2: Copiar el Proyecto

- [ ] Pegar la carpeta `pos-web-professional` en la nueva PC
- [ ] Verificar que TODOS los archivos se copiaron correctamente

### Paso 3: Instalación

**Opción A - Instalación Automática (Recomendado):**
- [ ] Doble clic en `install.bat`
- [ ] Esperar a que termine (puede tomar 5-10 minutos)
- [ ] Verificar mensaje: "INSTALACION COMPLETADA EXITOSAMENTE!"

**Opción B - Instalación Manual:**
```powershell
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

### Paso 4: Ejecutar el Proyecto

**Opción A - Inicio Automático (Recomendado):**
- [ ] Doble clic en `start-dev.bat`
- [ ] Esperar a que se abran 2 ventanas:
  - [ ] Backend - Puerto 3001
  - [ ] Frontend - Puerto 3000
- [ ] Abrir navegador en: `http://localhost:3000`

**Opción B - Inicio Manual:**
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Paso 5: Verificación

- [ ] Backend corriendo en `http://localhost:3001`
- [ ] Frontend corriendo en `http://localhost:3000`
- [ ] Aplicación abre correctamente en el navegador
- [ ] Dashboard se muestra sin errores
- [ ] Puedes navegar entre secciones
- [ ] Puedes agregar un ticket de prueba

---

## 💾 Migrar Datos (Opcional)

Si quieres llevar los datos de una PC a otra:

### En la PC ORIGINAL:
- [ ] Abrir `http://localhost:3000/admin`
- [ ] Ir a "Database Manager"
- [ ] Click en "Exportar"
- [ ] Guardar archivo JSON
- [ ] Copiar el archivo JSON a una USB

### En la PC NUEVA:
- [ ] Copiar el archivo JSON de la USB
- [ ] Abrir `http://localhost:3000/admin`
- [ ] Ir a "Database Manager"
- [ ] Click en "Importar"
- [ ] Seleccionar el archivo JSON
- [ ] Verificar que los datos aparecen

---

## ⚠️ Problemas Comunes y Soluciones

### ❌ "npm no se reconoce como comando"
**Solución:**
- [ ] Instalar Node.js desde https://nodejs.org/
- [ ] Reiniciar la terminal
- [ ] Verificar: `node -v`

### ❌ "Cannot find module"
**Solución:**
- [ ] Ejecutar `install.bat` de nuevo
- [ ] O manualmente:
  ```powershell
  cd backend
  npm install
  cd ../frontend
  npm install
  ```

### ❌ "Port 3000 is already in use"
**Solución:**
- [ ] Cerrar cualquier app que use puerto 3000
- [ ] O cambiar puerto en `frontend/package.json`:
  ```json
  "dev": "next dev -p 3002"
  ```

### ❌ "Port 3001 is already in use"
**Solución:**
- [ ] Cerrar cualquier app que use puerto 3001
- [ ] Verificar con: `netstat -ano | findstr :3001`
- [ ] Matar el proceso si es necesario

### ❌ La página se ve rota o sin estilos
**Solución:**
- [ ] Limpiar caché del navegador (Ctrl+Shift+Delete)
- [ ] Reconstruir frontend:
  ```powershell
  cd frontend
  npm run build
  npm run dev
  ```

### ❌ Error de permisos
**Solución:**
- [ ] Ejecutar PowerShell como Administrador
- [ ] Limpiar caché:
  ```powershell
  npm cache clean --force
  ```
- [ ] Reinstalar dependencias

---

## 🔄 Limpiar e Reinstalar (Si algo falla)

### Limpiar Backend:
```powershell
cd backend
Remove-Item -Recurse -Force node_modules
npm install
```

### Limpiar Frontend:
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
npm install
```

---

## 📊 Resumen de Tamaños

**COPIAR (~50 MB sin node_modules):**
- Código fuente: ~10 MB
- Base de datos: ~5 MB
- Assets (imágenes): ~5 MB
- Configuración: <1 MB

**NO COPIAR (se regenera, ~500 MB):**
- backend/node_modules: ~200 MB
- frontend/node_modules: ~300 MB

---

## ✨ Lista Final de Verificación

- [ ] Node.js instalado en nueva PC
- [ ] Proyecto copiado sin node_modules
- [ ] `install.bat` ejecutado exitosamente
- [ ] `start-dev.bat` ejecutado exitosamente
- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 3000
- [ ] Aplicación funciona en el navegador
- [ ] Datos importados (si es necesario)
- [ ] Creada cuenta de respaldo/backup

---

## 🎉 ¡Completado!

Si todos los items están marcados, tu sistema está listo en la nueva computadora.

**URLs para recordar:**
- 🖥️ Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:3001
- ⚙️ Admin: http://localhost:3000/admin

**Archivos importantes:**
- 📖 SETUP.md - Guía detallada
- 📄 README.md - Documentación general
- 🔧 install.bat - Instalador
- ▶️ start-dev.bat - Iniciar proyecto

---

**¿Necesitas ayuda?**
Ver SETUP.md sección "Solución de Problemas" o "Soporte"
