# 📁 UBICACIÓN DE LA BASE DE DATOS

## 🎯 Ruta de la Base de Datos del Sistema

La base de datos SQLite que almacena todos los **cierres de caja** se encuentra en:

### Durante Desarrollo (código fuente):
```
backend/src/database/pos_system.db
```

### Durante Producción (código compilado):
```
backend/dist/database/pos_system.db
```

---

## 🔍 Cómo verificar la ubicación actual

### Método 1: Ver en los logs del servidor

Cuando inicies el servidor con `start-server.bat`, verás un mensaje como este:

```
📁 BASE DE DATOS DE CIERRES DE CAJA:
   C:\Users\crist\OneDrive\Escritorio\pos-web-professional\backend\dist\database\pos_system.db

✅ Conectado a la base de datos SQLite
```

### Método 2: Verificar manualmente

**En PowerShell:**
```powershell
# Verificar si existe en dist (producción)
dir backend\dist\database\pos_system.db

# Verificar si existe en src (desarrollo)
dir backend\src\database\pos_system.db
```

---

## 📊 Tabla de Cierres de Caja

La tabla `cash_closures` contiene:

| Campo               | Descripción                          |
|---------------------|--------------------------------------|
| id                  | ID único del cierre                  |
| closure_number      | Número de cierre (ej: "CIERRE-001") |
| start_date          | Fecha de inicio del periodo          |
| end_date            | Fecha de fin del periodo             |
| parking_revenue     | Ingresos de parqueadero              |
| carwash_revenue     | Ingresos de lavadero                 |
| total_revenue       | Total de ingresos                    |
| total_commissions   | Total de comisiones                  |
| net_profit          | Ganancia neta                        |
| parking_data        | JSON con datos de parqueadero        |
| carwash_data        | JSON con datos de lavadero           |
| worker_commissions  | JSON con comisiones de trabajadores  |
| created_by          | Usuario que creó el cierre           |
| notes               | Notas adicionales                    |
| pdf_generated       | Si se generó PDF (0 o 1)             |
| created_at          | Fecha de creación del registro       |

---

## 🔧 Consultar la base de datos manualmente

### Usar SQLite Browser (Recomendado)

1. Descarga **DB Browser for SQLite**: https://sqlitebrowser.org/
2. Abre el archivo `backend\dist\database\pos_system.db`
3. Ve a la pestaña "Browse Data"
4. Selecciona la tabla `cash_closures`

### Usar línea de comandos

**PowerShell:**
```powershell
# Ir a la carpeta del backend
cd backend\dist\database

# Si tienes sqlite3 instalado
sqlite3 pos_system.db

# Comandos dentro de sqlite3:
.tables                          # Ver todas las tablas
.schema cash_closures           # Ver estructura de la tabla
SELECT * FROM cash_closures;    # Ver todos los cierres
.quit                           # Salir
```

---

## ⚠️ IMPORTANTE: Diferencia entre src y dist

### `backend/src/database/` (Código Fuente)
- Esta es la ruta en el **código TypeScript**
- El archivo `DatabaseService.ts` apunta a `../database/pos_system.db`
- Cuando ejecutas `npm run dev`, se usa esta carpeta

### `backend/dist/database/` (Código Compilado)
- Esta es la ruta en el **código JavaScript compilado**
- Cuando ejecutas `npm run build`, TypeScript compila a `dist/`
- Cuando ejecutas `start-server.bat`, se usa esta carpeta
- **Esta es la base de datos real en producción**

---

## 🔄 Sincronización

Si haces cambios en `backend/src/` y ejecutas `npm run build`, el archivo `.js` compilado irá a `backend/dist/`, pero **la base de datos NO se copia automáticamente**.

Por eso, el sistema crea automáticamente la carpeta y el archivo en `backend/dist/database/` cuando:
1. No existe la carpeta
2. Inicias el servidor por primera vez

---

## 📝 Logs del Sistema

Los logs del backend (incluyendo información de la base de datos) se guardan en:

```
backend/logs/combined.log
```

Puedes ver los logs con:
```powershell
type backend\logs\combined.log
```

---

## ✅ Verificación Rápida

**Script para verificar la base de datos:**

```powershell
# Copiar y pegar en PowerShell:
$dbPath = "backend\dist\database\pos_system.db"
if (Test-Path $dbPath) {
    $fullPath = (Resolve-Path $dbPath).Path
    $size = (Get-Item $dbPath).Length
    Write-Host "✅ Base de datos encontrada:" -ForegroundColor Green
    Write-Host "   Ruta: $fullPath" -ForegroundColor Cyan
    Write-Host "   Tamaño: $size bytes" -ForegroundColor Cyan
} else {
    Write-Host "❌ Base de datos NO encontrada en: $dbPath" -ForegroundColor Red
    Write-Host "   Ejecuta: init-database.bat" -ForegroundColor Yellow
}
```

---

**Última actualización:** 13 de octubre de 2025
