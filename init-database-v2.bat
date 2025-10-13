@echo off
echo ========================================
echo   INICIALIZADOR DE BASE DE DATOS v2
echo   Sistema POS - Parqueadero y Lavadero
echo ========================================
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado
node --version

echo.
echo Creando carpeta para la base de datos...
if not exist "backend\dist\database" (
    mkdir "backend\dist\database"
    echo [OK] Carpeta creada
) else (
    echo [OK] Carpeta ya existe
)

REM Verificar si ya existe la base de datos
if exist "backend\dist\database\pos_system.db" (
    echo.
    echo [!] ATENCION: Ya existe una base de datos
    echo.
    set /p respuesta="¿Desea crear una nueva? (Esto BORRARA la actual) [S/N]: "
    if /i "%respuesta%"=="S" (
        echo Eliminando base de datos actual...
        del "backend\dist\database\pos_system.db"
        echo [OK] Base de datos eliminada
    ) else (
        echo.
        echo Operacion cancelada.
        pause
        exit /b 0
    )
)

echo.
echo ========================================
echo   Paso 1: Instalando dependencias
echo ========================================
echo.
cd backend
echo Instalando dependencias de backend...
call npm install

if errorlevel 1 (
    echo.
    echo [ERROR] No se pudieron instalar las dependencias
    echo.
    cd ..
    pause
    exit /b 1
)

echo.
echo Instalando sqlite3...
call npm install sqlite3 --save

if errorlevel 1 (
    echo.
    echo [ADVERTENCIA] Hubo un problema al instalar sqlite3
    echo Intentando continuar de todas formas...
    echo.
)

cd ..

echo.
echo ========================================
echo   Paso 2: Creando base de datos
echo ========================================
echo.

REM Ejecutar el script de creacion
node setup-database.js

if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo crear la base de datos
    echo.
    echo SOLUCIONES:
    echo 1. Ejecuta: fix-sqlite3.bat
    echo 2. O instala manualmente: cd backend ^&^& npm install sqlite3
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   [EXITO] BASE DE DATOS LISTA
echo ========================================
echo.
echo La base de datos se encuentra en:
echo backend\dist\database\pos_system.db
echo.
echo Proximos pasos:
echo 1. Inicia el servidor: start-server.bat
echo 2. Abre el navegador: http://localhost:5000
echo.
pause
