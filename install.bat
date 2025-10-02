@echo off
echo ================================================
echo   INSTALADOR AUTOMATICO - WILSON POS SYSTEM
echo ================================================
echo.

REM Verificar que Node.js este instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no esta instalado!
    echo Por favor descarga e instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Mostrar version de Node
echo [OK] Node.js encontrado:
node -v
echo.

REM Mostrar version de npm
echo [OK] npm encontrado:
npm -v
echo.
echo ================================================

REM Instalar dependencias del BACKEND
echo.
echo [1/2] Instalando dependencias del BACKEND...
echo ================================================
cd backend
if not exist "package.json" (
    echo [ERROR] No se encuentra package.json en la carpeta backend!
    cd ..
    pause
    exit /b 1
)
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la instalacion del backend!
    cd ..
    pause
    exit /b 1
)
echo [OK] Backend instalado correctamente!
cd ..

REM Instalar dependencias del FRONTEND
echo.
echo [2/2] Instalando dependencias del FRONTEND...
echo ================================================
cd frontend
if not exist "package.json" (
    echo [ERROR] No se encuentra package.json en la carpeta frontend!
    cd ..
    pause
    exit /b 1
)
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo la instalacion del frontend!
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend instalado correctamente!
cd ..

REM Instalacion completa
echo.
echo ================================================
echo   INSTALACION COMPLETADA EXITOSAMENTE!
echo ================================================
echo.
echo Ahora puedes ejecutar el proyecto con:
echo   - Ejecutar "start-dev.bat" para modo desarrollo
echo   - O seguir las instrucciones en SETUP.md
echo.
pause
