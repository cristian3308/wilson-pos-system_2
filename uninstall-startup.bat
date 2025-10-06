@echo off
title Desinstalar POS del Inicio Automatico
color 0C

echo ============================================
echo   Desinstalar del Inicio Automatico
echo   POS Web Professional
echo ============================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\POS-Server.lnk"

if exist "%SHORTCUT_PATH%" (
    echo [INFO] Eliminando acceso directo del inicio...
    del "%SHORTCUT_PATH%"
    echo.
    echo ============================================
    echo   DESINSTALACION EXITOSA!
    echo ============================================
    echo.
    echo El servidor POS ya NO se iniciara
    echo automaticamente al encender la computadora.
    echo.
) else (
    echo [INFO] No se encontro el acceso directo.
    echo.
    echo El servidor ya no esta en el inicio automatico
    echo o nunca fue instalado.
)

echo ============================================
echo.
pause
