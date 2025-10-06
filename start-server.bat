@echo off
REM Este script inicia los servidores de forma visible (para ejecutar manualmente)
title POS Web Professional - Server
color 0A

echo ============================================
echo   POS Web Professional - Starting Server
echo ============================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

echo [INFO] Directorio actual: %CD%
echo.

REM Verificar si existe node_modules
if not exist "node_modules" (
    echo [WARNING] node_modules no encontrado. Instalando dependencias...
    echo.
    call npm install
    echo.
)

REM Iniciar backend en una nueva ventana
echo [INFO] Iniciando Backend...
start "POS Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

REM Iniciar frontend en una nueva ventana
echo [INFO] Iniciando Frontend...
start "POS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   Servidores iniciados correctamente!
echo ============================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ============================================
echo.
echo Los servidores seguiran ejecutandose en sus ventanas.
echo Puedes cerrar esta ventana de forma segura.
echo.
echo Para detener los servidores, cierra las ventanas
echo "POS Backend" y "POS Frontend".
echo ============================================

REM Esperar 5 segundos antes de cerrar esta ventana
timeout /t 5 /nobreak >nul
exit
