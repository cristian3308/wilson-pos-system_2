@echo off
title Solucionar Error de Pull
color 0E

echo ============================================
echo   Solucionar Error de Pull
echo   "Please commit your changes or stash"
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
    pause
    exit /b 1
)

echo [INFO] Verificando cambios locales...
echo.

REM Mostrar archivos modificados
git status --short

echo.
echo ============================================
echo   OPCIONES DISPONIBLES
echo ============================================
echo.
echo 1. GUARDAR cambios locales (stash) y hacer pull
echo    - Tus cambios se guardan temporalmente
echo    - Puedes recuperarlos despues
echo.
echo 2. DESCARTAR cambios locales y hacer pull
echo    - CUIDADO: Perdera todos los cambios locales
echo    - Solo usar si no te importan los cambios
echo.
echo 3. CANCELAR y revisar manualmente
echo.

choice /C 123 /M "Selecciona una opcion"

if errorlevel 3 (
    echo.
    echo [INFO] Operacion cancelada.
    echo.
    echo Puedes revisar los cambios manualmente con:
    echo   git status
    echo   git diff
    echo.
    pause
    exit /b 0
)

if errorlevel 2 (
    echo.
    echo [WARNING] Estas a punto de DESCARTAR todos los cambios locales.
    echo.
    choice /C SN /M "Estas SEGURO? Esta accion NO se puede deshacer"
    
    if errorlevel 2 (
        echo.
        echo [INFO] Operacion cancelada.
        pause
        exit /b 0
    )
    
    echo.
    echo [INFO] Descartando cambios locales...
    git reset --hard HEAD
    git clean -fd
    
    echo.
    echo [INFO] Haciendo pull desde GitHub...
    git pull origin main
    
    if %errorLevel% equ 0 (
        echo.
        echo ============================================
        echo   PULL EXITOSO!
        echo ============================================
        echo.
        echo Los cambios han sido descargados.
        echo Tus cambios locales fueron descartados.
        echo.
    )
)

if errorlevel 1 (
    echo.
    echo [INFO] Guardando cambios locales (stash)...
    git stash save "Cambios guardados antes de pull - %date% %time%"
    
    echo.
    echo [INFO] Haciendo pull desde GitHub...
    git pull origin main
    
    if %errorLevel% equ 0 (
        echo.
        echo ============================================
        echo   PULL EXITOSO!
        echo ============================================
        echo.
        echo Los cambios han sido descargados.
        echo Tus cambios locales estan guardados.
        echo.
        
        REM Verificar si hay algo en stash
        git stash list | findstr /C:"Cambios guardados antes de pull" >nul
        if %errorLevel% equ 0 (
            echo [INFO] Para recuperar tus cambios guardados:
            echo.
            echo   Opcion A - Aplicar cambios guardados:
            echo     git stash pop
            echo.
            echo   Opcion B - Ver cambios guardados:
            echo     git stash list
            echo     git stash show
            echo.
            
            choice /C SN /M "Quieres recuperar tus cambios guardados AHORA"
            
            if errorlevel 1 (
                echo.
                echo [INFO] Recuperando cambios guardados...
                git stash pop
                
                if %errorLevel% equ 0 (
                    echo.
                    echo [SUCCESS] Cambios recuperados exitosamente!
                ) else (
                    echo.
                    echo [WARNING] Hubo conflictos al recuperar los cambios.
                    echo.
                    echo Puedes resolverlos manualmente o usar:
                    echo   git stash drop  (para descartar los cambios guardados)
                )
            ) else (
                echo.
                echo [INFO] Los cambios quedan guardados.
                echo Puedes recuperarlos mas tarde con: git stash pop
            )
        )
    )
)

echo.
echo ============================================
pause
