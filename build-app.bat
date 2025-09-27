@echo off
echo ====================================
echo   Wilson POS - Compilación Completa
echo ====================================
echo.

echo [1/6] Limpiando directorios anteriores...
if exist "dist" rmdir /s /q "dist"
if exist "frontend\out" rmdir /s /q "frontend\out"
if exist "frontend\.next" rmdir /s /q "frontend\.next"

echo [2/6] Instalando dependencias del backend...
cd backend
call npm install
cd ..

echo [3/6] Instalando dependencias del frontend...
cd frontend
call npm install
cd ..

echo [4/6] Compilando backend...
cd backend
call npm run build
cd ..

echo [5/6] Compilando y exportando frontend...
cd frontend
call npm run build
cd ..

echo [6/6] Creando aplicación ejecutable...
call npm run package:win

echo.
echo ====================================
echo   ¡COMPILACIÓN COMPLETADA!
echo ====================================
echo.
echo El archivo ejecutable se encuentra en: 
echo   dist\Wilson POS System Setup.exe
echo.
echo Para instalar en otro computador:
echo   1. Copie el archivo .exe
echo   2. Ejecute como administrador
echo   3. Siga el asistente de instalación
echo.
pause