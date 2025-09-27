@echo off
title Wilson POS System - Empaquetado Completo

echo =============================================
echo    WILSON POS SYSTEM - EMPAQUETADO COMPLETO
echo =============================================
echo.
echo Este proceso creará un ejecutable completo
echo que funciona en cualquier computador Windows
echo sin necesidad de instalaciones adicionales.
echo.
echo Tiempo estimado: 3-5 minutos
echo.
pause

echo.
echo [PASO 1/7] Verificando Node.js...
node --version || (
    echo ERROR: Node.js no está instalado
    echo Instale Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

echo [PASO 2/7] Instalando dependencias principales...
call npm install --only=dev

echo [PASO 3/7] Compilando backend...
cd backend
if exist "dist" rmdir /s /q "dist"
call npm install
call npm run build
cd ..

echo [PASO 4/7] Compilando frontend...
cd frontend  
if exist "out" rmdir /s /q "out"
if exist ".next" rmdir /s /q ".next" 
call npm install
call npm run build
cd ..

echo [PASO 5/7] Creando aplicación Electron...
if exist "dist" rmdir /s /q "dist"
call npm run package:win

echo [PASO 6/7] Creando versión portable...
call npm run package:portable

echo [PASO 7/7] Finalizando...
echo.
echo =============================================
echo           ¡PROCESO COMPLETADO!
echo =============================================
echo.
echo Archivos generados en la carpeta 'dist/':
echo.
echo 📦 Wilson POS System Setup.exe    (Instalador)
echo 💼 Wilson POS System.exe          (Portable)
echo.
echo INSTRUCCIONES:
echo 1. Para instalar: Ejecutar Setup.exe como Administrador
echo 2. Para portable: Copiar toda la carpeta y ejecutar .exe
echo.
echo ✅ El sistema funciona sin internet
echo ✅ No requiere Node.js en el computador destino  
echo ✅ Base de datos local incluida
echo ✅ Todas las funcionalidades operativas
echo.
explorer dist
echo.
pause