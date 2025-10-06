@echo off
title Detener Servidores POS
color 0C

echo ============================================
echo   Detener Servidores POS
echo ============================================
echo.

echo [INFO] Buscando procesos de Node.js...
echo.

REM Mostrar procesos de Node.js activos
tasklist | findstr node.exe

echo.
echo [WARNING] Se van a DETENER todos los procesos de Node.js
echo.
echo Esto incluye:
echo - Backend del POS (Puerto 5000)
echo - Frontend del POS (Puerto 3000)
echo - Cualquier otro proceso de Node.js ejecutandose
echo.

choice /C SN /M "Continuar y detener los servidores"

if errorlevel 2 (
    echo.
    echo [INFO] Operacion cancelada.
    timeout /t 2 /nobreak >nul
    exit /b 0
)

if errorlevel 1 (
    echo.
    echo [INFO] Deteniendo todos los procesos de Node.js...
    taskkill /F /IM node.exe
    
    echo.
    echo ============================================
    echo   SERVIDORES DETENIDOS
    echo ============================================
    echo.
    echo Todos los procesos de Node.js han sido detenidos.
    echo.
    echo Para iniciar de nuevo:
    echo - Ejecuta: start-server.bat
    echo - O reinicia tu computadora (si tienes inicio automatico)
    echo.
    echo ============================================
)

echo.
pause
