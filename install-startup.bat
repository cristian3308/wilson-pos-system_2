@echo off
title Instalar POS en Inicio Automatico
color 0E

echo ============================================
echo   Instalacion en Inicio Automatico
echo   POS Web Professional
echo ============================================
echo.

REM Solicitar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Este script requiere permisos de administrador.
    echo.
    echo Por favor, haz clic derecho y selecciona:
    echo "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo [INFO] Permisos de administrador verificados.
echo.

REM Obtener ruta completa del proyecto
set "PROJECT_PATH=%~dp0"
set "STARTUP_VBS=%PROJECT_PATH%start-server-hidden.vbs"

REM Crear acceso directo en la carpeta de inicio
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\POS-Server.lnk"

echo [INFO] Creando acceso directo en inicio automatico...
echo [INFO] El servidor se ejecutara SIN VENTANAS VISIBLES
echo.

REM Crear el acceso directo usando PowerShell (apuntando al archivo VBS)
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%SHORTCUT_PATH%'); $SC.TargetPath = '%STARTUP_VBS%'; $SC.WorkingDirectory = '%PROJECT_PATH%'; $SC.WindowStyle = 7; $SC.Description = 'POS Web Professional Server (Oculto)'; $SC.Save()"

if exist "%SHORTCUT_PATH%" (
    echo ============================================
    echo   INSTALACION EXITOSA!
    echo ============================================
    echo.
    echo El servidor POS se iniciara automaticamente
    echo cuando enciendas la computadora.
    echo.
    echo IMPORTANTE: El servidor se ejecutara SIN
    echo VENTANAS VISIBLES (en segundo plano).
    echo.
    echo Ubicacion del acceso directo:
    echo %SHORTCUT_PATH%
    echo.
    echo ============================================
    echo.
    echo OPCIONES:
    echo.
    echo 1. Para probar ahora: Ejecuta start-server.bat
    echo 2. Para actualizar: Ejecuta update-from-github.bat
    echo 3. Para desinstalar: Ejecuta uninstall-startup.bat
    echo.
    echo ============================================
) else (
    echo [ERROR] No se pudo crear el acceso directo.
    echo.
    echo Por favor, verifica que tienes permisos
    echo de administrador y vuelve a intentar.
)

echo.
pause
