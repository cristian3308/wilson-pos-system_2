@echo off
echo ========================================
echo   INICIALIZADOR DE BASE DE DATOS
echo   Sistema POS - Parqueadero y Lavadero
echo ========================================
echo.

REM Verificar si existe la carpeta de la base de datos
if not exist "backend\dist\database" (
    echo Creando carpeta backend\dist\database...
    mkdir "backend\dist\database"
    echo [OK] Carpeta creada
) else (
    echo [OK] Carpeta backend\dist\database ya existe
)

echo.
echo Verificando base de datos...

REM Verificar si ya existe la base de datos
if exist "backend\dist\database\pos_system.db" (
    echo.
    echo [!] ATENCION: Ya existe una base de datos
    echo.
    set /p respuesta="¿Desea crear una nueva base de datos? (Esto BORRARA la actual) [S/N]: "
    if /i "%respuesta%"=="S" (
        echo Eliminando base de datos actual...
        del "backend\dist\database\pos_system.db"
        echo [OK] Base de datos eliminada
    ) else (
        echo.
        echo Operacion cancelada. Se mantiene la base de datos actual.
        pause
        exit /b 0
    )
)

echo.
echo Instalando dependencias de backend...
cd backend
call npm install
if errorlevel 1 (
    echo [ERROR] No se pudieron instalar las dependencias
    cd ..
    pause
    exit /b 1
)

echo.
echo Instalando sqlite3 especificamente...
call npm install sqlite3 --save
if errorlevel 1 (
    echo [ERROR] No se pudo instalar sqlite3
    cd ..
    pause
    exit /b 1
)

echo.
echo Creando base de datos...
node -e "const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./dist/database/pos_system.db', (err) => { if (err) { console.error('[ERROR]', err.message); process.exit(1); } console.log('[OK] Base de datos creada'); }); const sql = 'CREATE TABLE IF NOT EXISTS cash_closures (id INTEGER PRIMARY KEY AUTOINCREMENT, closure_number TEXT NOT NULL UNIQUE, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, parking_revenue DECIMAL(10,2) DEFAULT 0, carwash_revenue DECIMAL(10,2) DEFAULT 0, total_revenue DECIMAL(10,2) DEFAULT 0, total_commissions DECIMAL(10,2) DEFAULT 0, net_profit DECIMAL(10,2) DEFAULT 0, parking_data TEXT DEFAULT \"[]\", carwash_data TEXT DEFAULT \"[]\", worker_commissions TEXT DEFAULT \"[]\", created_by TEXT DEFAULT \"sistema\", notes TEXT DEFAULT \"\", pdf_generated BOOLEAN DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_cash_closures_dates ON cash_closures(start_date, end_date); CREATE INDEX IF NOT EXISTS idx_cash_closures_created_at ON cash_closures(created_at);'; db.exec(sql, (err) => { if (err) { console.error('[ERROR]', err.message); process.exit(1); } console.log('[OK] Tabla cash_closures creada'); console.log('[OK] Indices creados'); db.close(); });"

cd ..

if exist "backend\dist\database\pos_system.db" (
    echo.
    echo ========================================
    echo   [EXITO] BASE DE DATOS INICIALIZADA
    echo ========================================
    echo.
    echo La base de datos se encuentra en:
    echo backend\dist\database\pos_system.db
    echo.
    echo Ahora puedes iniciar el sistema con:
    echo   start-server.bat
    echo.
) else (
    echo.
    echo ========================================
    echo   [ERROR] NO SE PUDO CREAR LA BD
    echo ========================================
    echo.
    echo Verifica que Node.js este instalado
    echo y que las dependencias se instalaron
    echo correctamente.
    echo.
)

pause
