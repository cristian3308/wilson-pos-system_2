@echo off
title Actualizar POS desde GitHub
color 0B

echo ============================================
echo   Actualizar POS Web Professional
echo   Descargando cambios desde GitHub
echo ============================================
echo.

REM Cambiar al directorio del proyecto
cd /d "%~dp0"

echo [INFO] Directorio actual: %CD%
echo.

REM Verificar si es un repositorio Git
if not exist ".git" (
    echo [ERROR] Este directorio no es un repositorio Git.
    echo.
    echo Por favor, asegurate de estar en la carpeta correcta
    echo del proyecto pos-web-professional.
    echo.
    pause
    exit /b 1
)

echo [INFO] Verificando conexion con GitHub...
echo.

REM Verificar estado del repositorio
git status

echo.
echo ============================================
echo   IMPORTANTE: CAMBIOS LOCALES
echo ============================================
echo.
echo Si tienes cambios sin guardar, se guardaran
echo automaticamente antes de actualizar.
echo.
pause

echo.
echo [INFO] Guardando cambios locales (stash)...
git stash save "Cambios locales antes de actualizar - %date% %time%"

echo.
echo [INFO] Descargando ultimos cambios desde GitHub...
echo.

REM Descargar cambios desde GitHub
git pull origin main

if %errorLevel% equ 0 (
    echo.
    echo ============================================
    echo   ACTUALIZACION EXITOSA!
    echo ============================================
    echo.
    echo Los cambios han sido descargados correctamente
    echo desde GitHub.
    echo.
    
    REM Verificar si hay cambios en stash para restaurar
    git stash list | findstr /C:"Cambios locales antes de actualizar" >nul
    if %errorLevel% equ 0 (
        echo [INFO] Restaurando cambios locales...
        git stash pop
        echo.
    )
    
    echo [INFO] Actualizando dependencias...
    echo.
    
    REM Actualizar dependencias del backend si hay cambios en package.json
    if exist "backend\package.json" (
        echo [INFO] Actualizando dependencias del Backend...
        cd backend
        call npm install
        cd ..
        echo.
    )
    
    REM Actualizar dependencias del frontend si hay cambios en package.json
    if exist "frontend\package.json" (
        echo [INFO] Actualizando dependencias del Frontend...
        cd frontend
        call npm install
        cd ..
        echo.
    )
    
    echo ============================================
    echo   ACTUALIZACION COMPLETA!
    echo ============================================
    echo.
    echo El sistema esta actualizado y listo para usar.
    echo.
    echo IMPORTANTE: Si los servidores estaban corriendo,
    echo debes reiniciarlos para aplicar los cambios:
    echo.
    echo 1. Cierra las ventanas del servidor
    echo 2. Ejecuta start-server.bat de nuevo
    echo    (o reinicia tu computadora si usas inicio automatico)
    echo.
    echo ============================================
    
) else (
    echo.
    echo [ERROR] Hubo un problema al actualizar.
    echo.
    echo Posibles causas:
    echo - Sin conexion a internet
    echo - Conflictos con cambios locales
    echo - Problemas con GitHub
    echo.
    echo Por favor, revisa los mensajes de error arriba.
)

echo.
pause
