# 🎯 INSTALACIÓN EN OTRO PC - VERSIÓN SIMPLE

## ⏱️ TIEMPO TOTAL: 15-20 minutos

---

## PASO 1️⃣: INSTALAR NODE.JS ⏱️ 3 min

1. Abre tu navegador
2. Ve a: **https://nodejs.org/**
3. Descarga el botón verde grande que dice **"LTS"**
4. Ejecuta el archivo descargado
5. Haz clic en **"Siguiente"** hasta que termine
6. ✅ **Verificar:** Abre PowerShell y escribe:
   ```
   node --version
   ```
   Debe mostrar algo como: `v18.17.0`

---

## PASO 2️⃣: INSTALAR GIT ⏱️ 2 min

1. Ve a: **https://git-scm.com/download/win**
2. Se descargará automáticamente
3. Ejecuta el instalador
4. Deja todo por defecto (solo haz clic en "Next")
5. ✅ **Verificar:** En PowerShell escribe:
   ```
   git --version
   ```
   Debe mostrar algo como: `git version 2.41.0`

---

## PASO 3️⃣: DESCARGAR EL PROYECTO ⏱️ 2 min

1. Abre **PowerShell**:
   - Presiona `Windows + R`
   - Escribe: `powershell`
   - Presiona Enter

2. Ve a tu escritorio:
   ```powershell
   cd Desktop
   ```

3. Descarga el proyecto:
   ```powershell
   git clone https://github.com/cristian3308/wilson-pos-system_2.git
   ```
   Verás algo como:
   ```
   Cloning into 'wilson-pos-system_2'...
   Receiving objects: 100%...
   ```

4. Entra a la carpeta:
   ```powershell
   cd wilson-pos-system_2
   ```

---

## PASO 4️⃣: INSTALAR TODO ⏱️ 5-8 min

### 4A. Instalar dependencias principales:
```powershell
npm install
```
⏳ Espera 2-3 minutos...

### 4B. Instalar dependencias del backend:
```powershell
cd backend
npm install
cd ..
```
⏳ Espera 2-3 minutos...

### 4C. Instalar dependencias del frontend:
```powershell
cd frontend
npm install
cd ..
```
⏳ Espera 2-3 minutos...

---

## PASO 5️⃣: CREAR LA BASE DE DATOS ⏱️ 1 min

Ejecuta este comando:
```powershell
node setup-database.js
```

✅ **Debes ver:**
```
✅ Base de datos encontrada
✅ Tabla cash_closures creada correctamente
```

---

## PASO 6️⃣: INICIAR EL SISTEMA ⏱️ 1 min

Ejecuta:
```powershell
npm run dev
```

✅ **Debes ver:**
```
[0] 🚀 Server running on port 5000
[1] ▲ Next.js - Local: http://localhost:3000
```

**⚠️ NO CIERRES ESTA VENTANA** - El sistema está corriendo aquí

---

## PASO 7️⃣: ABRIR EN EL NAVEGADOR ⏱️ 30 seg

1. Abre **Chrome** (o tu navegador favorito)
2. Ve a: **http://localhost:3000**
3. 🎉 **¡Listo!** Deberías ver el dashboard

---

## ✅ VERIFICACIÓN RÁPIDA

Marca cada punto cuando funcione:

- [ ] ✅ Se ve el dashboard principal
- [ ] ✅ Aparecen números en las tarjetas (Ingresos, Vehículos)
- [ ] ✅ El botón "Cierre de Caja" funciona
- [ ] ✅ El botón "Ver Cierres Guardados" aparece
- [ ] ✅ Puedes hacer un cierre de caja
- [ ] ✅ El cierre se guarda y aparece en el selector

---

## 🆘 SI ALGO FALLA

### ❌ "npm no se reconoce como comando"
**Solución:**
1. Cierra PowerShell
2. Reinstala Node.js
3. Abre PowerShell de nuevo
4. Intenta otra vez

### ❌ "Puerto 3000 ya está en uso"
**Solución:**
```powershell
npx kill-port 3000
npx kill-port 5000
npm run dev
```

### ❌ "Cannot find module 'sqlite3'"
**Solución:**
```powershell
cd backend
npm install sqlite3
cd ..
npm run dev
```

### ❌ "La tabla cash_closures no existe"
**Solución:**
```powershell
node backend/create-cash-closures.js
npm run dev
```

### ❌ Pantalla en blanco
**Solución:**
1. Presiona `Ctrl + C` en PowerShell (para parar el servidor)
2. Ejecuta: `npm run dev` otra vez
3. Refresca el navegador (F5)

---

## 🔄 PARA CERRAR EL SISTEMA

Cuando termines de usarlo:
1. Ve a la ventana de PowerShell
2. Presiona `Ctrl + C`
3. Escribe `S` y presiona Enter
4. Listo, el sistema se detuvo

---

## 🚀 PARA INICIARLO OTRA VEZ

Cada vez que quieras usar el sistema:

1. Abre PowerShell
2. Ve a la carpeta del proyecto:
   ```powershell
   cd Desktop\wilson-pos-system_2
   ```
3. Inicia el sistema:
   ```powershell
   npm run dev
   ```
4. Abre el navegador en: **http://localhost:3000**

---

## 📌 COMANDOS IMPORTANTES

### Ver si Node.js está instalado:
```powershell
node --version
npm --version
```

### Ver si Git está instalado:
```powershell
git --version
```

### Descargar actualizaciones del proyecto:
```powershell
git pull origin main
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### Limpiar todo y empezar de cero:
```powershell
# Eliminar instalaciones anteriores
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force backend/node_modules
Remove-Item -Recurse -Force frontend/node_modules

# Reinstalar todo
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## 📍 UBICACIÓN DE LOS ARCHIVOS

Después de instalar, tendrás esta estructura:

```
📁 Desktop/
  └── 📁 wilson-pos-system_2/
      ├── 📁 backend/
      │   ├── 📁 dist/
      │   │   └── 📁 database/
      │   │       └── 📄 pos_system.db  ← AQUÍ está la base de datos
      │   └── 📁 src/
      ├── 📁 frontend/
      │   └── 📁 src/
      └── 📄 package.json
```

---

## 🎓 GUÍAS ADICIONALES

Para más información, lee estos archivos en el proyecto:

- 📄 `INICIALIZAR-BASE-DATOS.md` - Más info sobre la base de datos
- 📄 `UBICACION-BASE-DATOS.md` - Dónde está la BD
- 📄 `CAMBIOS-CIERRES-IMPLEMENTADOS.md` - Qué hace el sistema
- 📄 `GUIA-INSTALACION-OTRO-PC.md` - Guía completa (más detallada)

---

## ✨ RESUMEN DE 7 PASOS

```
1️⃣ Instalar Node.js        → https://nodejs.org/
2️⃣ Instalar Git            → https://git-scm.com/download/win
3️⃣ Descargar proyecto      → git clone https://github.com/cristian3308/wilson-pos-system_2.git
4️⃣ Instalar dependencias   → npm install (x3 veces)
5️⃣ Crear base de datos     → node setup-database.js
6️⃣ Iniciar sistema         → npm run dev
7️⃣ Abrir navegador         → http://localhost:3000
```

---

## 💡 TIPS IMPORTANTES

- ✅ **Siempre abre PowerShell** en la carpeta del proyecto
- ✅ **No cierres la ventana** de PowerShell mientras usas el sistema
- ✅ **Espera** a que termine cada instalación antes de continuar
- ✅ **Lee los mensajes** de error si algo falla
- ✅ **Mantén el proyecto** en un lugar fácil de encontrar

---

## 📞 CONTACTO

Si después de seguir todos los pasos aún tienes problemas:
1. Revisa la sección **"SI ALGO FALLA"** arriba
2. Lee los archivos de documentación del proyecto
3. Verifica que Node.js y Git estén bien instalados

---

**¡Éxito! 🎉**

Siguiendo estos 7 pasos tendrás el sistema funcionando en cualquier computador.

---

**Última actualización:** 13 de Octubre, 2025  
**Versión:** 2.0  
**GitHub:** cristian3308/wilson-pos-system_2
