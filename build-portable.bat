@echo off
echo ====================================
echo   Wilson POS - Versión Portable
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

echo [6/6] Creando aplicación portable...
call npm run package:portable

echo.
echo ====================================
echo   ¡VERSIÓN PORTABLE CREADA!
echo ====================================
echo.
echo El archivo portable se encuentra en: 
echo   dist\Wilson POS System.exe
echo.
echo Para usar en otro computador:
echo   1. Copie TODA la carpeta dist
echo   2. Ejecute Wilson POS System.exe
echo   3. ¡Listo para usar!
echo.
echo No necesita instalación ni permisos de administrador
echo.
pause