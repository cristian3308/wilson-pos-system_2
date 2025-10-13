# ===================================================
#  GUÍA DE INICIALIZACIÓN DE BASE DE DATOS
#  Sistema POS - Parqueadero y Lavadero
# ===================================================

## 🎯 Método 1: Descargar desde GitHub (RECOMENDADO)

La base de datos ya está en GitHub. Solo necesitas descargarla:

```powershell
# En el otro computador, abre PowerShell y ejecuta:
cd "C:\ruta\del\proyecto\pos-web-professional"
git pull origin main
```

Verifica que existe:
```powershell
dir backend\dist\database\pos_system.db
```

Si ves el archivo, **¡listo!** Ya tienes la base de datos.

---

## 🛠️ Método 2: Crear base de datos nueva

Si no tienes la base de datos o quieres crear una nueva:

### Paso 1: Usa el script automático

Simplemente ejecuta:
```batch
init-database.bat
```

Este script:
- ✅ Crea la carpeta `backend\dist\database\` si no existe
- ✅ Instala las dependencias necesarias
- ✅ Crea la base de datos SQLite
- ✅ Crea la tabla `cash_closures` con todos sus campos
- ✅ Crea los índices para mejor rendimiento

### Paso 2: Verifica que funciona

Inicia el servidor:
```batch
start-server.bat
```

Abre el navegador en: `http://localhost:5000`

---

## 🔧 Método 3: Crear manualmente (si los scripts fallan)

Si necesitas crear la base de datos manualmente:

### 1. Crear la carpeta
```powershell
mkdir backend\dist\database
```

### 2. Instalar dependencias
```powershell
cd backend
npm install
cd ..
```

### 3. Crear la base de datos con Node.js

Ejecuta este comando (todo en una línea):

```powershell
cd backend
node -e "const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./dist/database/pos_system.db'); const sql = 'CREATE TABLE IF NOT EXISTS cash_closures (id INTEGER PRIMARY KEY AUTOINCREMENT, closure_number TEXT NOT NULL UNIQUE, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, parking_revenue DECIMAL(10,2) DEFAULT 0, carwash_revenue DECIMAL(10,2) DEFAULT 0, total_revenue DECIMAL(10,2) DEFAULT 0, total_commissions DECIMAL(10,2) DEFAULT 0, net_profit DECIMAL(10,2) DEFAULT 0, parking_data TEXT DEFAULT \"[]\", carwash_data TEXT DEFAULT \"[]\", worker_commissions TEXT DEFAULT \"[]\", created_by TEXT DEFAULT \"sistema\", notes TEXT DEFAULT \"\", pdf_generated BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)'; db.exec(sql, (err) => { if (err) console.error(err); else console.log('Tabla creada'); db.close(); });"
cd ..
```

---

## 📋 Estructura de la tabla cash_closures

La tabla se crea con estos campos:

| Campo               | Tipo          | Descripción                          |
|---------------------|---------------|--------------------------------------|
| id                  | INTEGER       | ID único autoincremental             |
| closure_number      | TEXT          | Número de cierre único               |
| start_date          | DATETIME      | Fecha de inicio del periodo          |
| end_date            | DATETIME      | Fecha de fin del periodo             |
| parking_revenue     | DECIMAL(10,2) | Ingresos de parqueadero             |
| carwash_revenue     | DECIMAL(10,2) | Ingresos de lavadero                |
| total_revenue       | DECIMAL(10,2) | Total de ingresos                   |
| total_commissions   | DECIMAL(10,2) | Total de comisiones                 |
| net_profit          | DECIMAL(10,2) | Ganancia neta                       |
| parking_data        | TEXT          | JSON con datos de parqueadero       |
| carwash_data        | TEXT          | JSON con datos de lavadero          |
| worker_commissions  | TEXT          | JSON con comisiones de trabajadores |
| created_by          | TEXT          | Usuario que creó el cierre          |
| notes               | TEXT          | Notas adicionales                   |
| pdf_generated       | BOOLEAN       | Si se generó PDF                    |
| created_at          | DATETIME      | Fecha de creación                   |

---

## ❗ Solución de problemas

### Error: "Módulo SQL3 no existe" o "No se encuentra sqlite3"

**Solución 1 - Usar script mejorado:**
```batch
init-database-v2.bat
```

**Solución 2 - Instalar sqlite3 manualmente:**
```batch
fix-sqlite3.bat
```

**Solución 3 - Instalación manual:**
```powershell
cd backend
npm install sqlite3 --save
cd ..
```

**Solución 4 - Si todo falla, instalar herramientas de compilación:**
1. Instala Node.js (versión LTS): https://nodejs.org/
2. Instala Python 3: https://www.python.org/
3. Instala Visual Studio Build Tools
4. Reinicia el computador
5. Ejecuta `fix-sqlite3.bat`

### Error: "Access denied" o "Permission denied"
- Cierra el servidor si está corriendo: `stop-server.bat`
- Ejecuta PowerShell como Administrador
- Vuelve a intentar

### Error: "Cannot find module"
```powershell
cd backend
npm install
cd frontend
npm install
cd ..
```

### La base de datos se crea pero no funciona
1. Detén el servidor: `stop-server.bat`
2. Elimina la base de datos: `del backend\dist\database\pos_system.db`
3. Vuelve a ejecutar: `init-database.bat`
4. Inicia el servidor: `start-server.bat`

---

## 🚀 Pasos después de inicializar

1. **Inicia el servidor**:
   ```batch
   start-server.bat
   ```

2. **Abre el navegador**: `http://localhost:5000`

3. **Inicia sesión**:
   - Usuario: `admin`
   - Contraseña: `admin123`

4. **Prueba el cierre de caja**:
   - Ve a "Cierres de Caja" en el menú
   - Haz un nuevo cierre para verificar que funciona

---

## 📞 Ubicación de archivos

- **Base de datos**: `backend\dist\database\pos_system.db`
- **Script de inicio**: `init-database.bat`
- **Logs del sistema**: `backend\logs\combined.log`

---

**¡Todo listo!** 🎉

Si tienes problemas, revisa los logs en `backend\logs\combined.log`
