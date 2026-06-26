@echo off
echo ========================================
echo   INSTALADOR DE SQLITE3
echo   Solucion para: "Modulo SQL3 no existe"
echo ========================================
echo.

echo Paso 1: Instalando dependencias en backend...
cd backend

echo.
echo Limpiando instalaciones previas...
if exist node_modules\sqlite3 (
    echo Eliminando sqlite3 anterior...
    rmdir /s /q node_modules\sqlite3
)

echo.
echo Instalando sqlite3 desde npm...
call npm install sqlite3 --save --verbose

if errorlevel 1 (
    echo.
    echo [ERROR] La instalacion fallo. Intentando metodo alternativo...
    echo.
    
    echo Intentando con rebuild...
    call npm rebuild sqlite3
    
    if errorlevel 1 (
        echo.
        echo [ERROR] No se pudo instalar sqlite3
        echo.
        echo SOLUCION ALTERNATIVA:
        echo 1. Instala Node.js desde: https://nodejs.org/
        echo 2. Instala Python desde: https://www.python.org/
        echo 3. Instala Visual Studio Build Tools
        echo 4. Vuelve a ejecutar este script
        echo.
        cd ..
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   [EXITO] SQLITE3 INSTALADO
echo ========================================
echo.
echo Ahora puedes ejecutar:
echo   init-database.bat
echo.
cd ..
pause
