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

REM Verificar si hay cambios sin guardar
git diff --quiet
set HAS_UNSTAGED=%errorLevel%

git diff --cached --quiet
set HAS_STAGED=%errorLevel%

REM Verificar archivos sin trackear
for /f %%i in ('git ls-files --others --exclude-standard ^| find /c /v ""') do set UNTRACKED=%%i

if %HAS_UNSTAGED% neq 0 (
    echo [WARNING] Cambios sin guardar detectados
)
if %HAS_STAGED% neq 0 (
    echo [WARNING] Cambios en staging detectados
)
if %UNTRACKED% gtr 0 (
    echo [WARNING] Archivos sin trackear detectados: %UNTRACKED%
)

if %HAS_UNSTAGED% neq 0 (
    echo.
    echo Se detectaron cambios locales. Elige una opcion:
    echo.
    echo 1. Guardar cambios temporalmente [stash] ^(recomendado^)
    echo 2. Descartar TODOS los cambios locales ^(PELIGROSO^)
    echo 3. Cancelar actualizacion
    echo.
    
    choice /C 123 /N /M "Selecciona [1, 2 o 3]: "
    
    if errorlevel 3 (
        echo.
        echo [INFO] Actualizacion cancelada por el usuario.
        echo.
        pause
        exit /b 0
    )
    
    if errorlevel 2 (
        echo.
        echo [WARNING] DESCARTANDO TODOS LOS CAMBIOS LOCALES...
        echo.
        timeout /t 3 /nobreak
        git reset --hard HEAD
        git clean -fd
        echo [OK] Cambios descartados completamente.
        echo.
        goto :update
    )
    
    if errorlevel 1 (
        echo.
        echo [INFO] Guardando cambios locales en stash...
        git add .
        git stash save "Cambios locales - %date% %time%"
        echo [OK] Cambios guardados temporalmente.
        echo.
        goto :update
    )
) else if %HAS_STAGED% neq 0 (
    echo.
    echo [INFO] Guardando cambios en staging...
    git stash save --include-untracked "Cambios staging - %date% %time%"
    echo [OK] Cambios guardados.
    echo.
) else if %UNTRACKED% gtr 0 (
    echo.
    echo [INFO] Archivos sin trackear encontrados, se ignoraran.
    echo.
) else (
    echo [OK] No hay cambios locales. Listo para actualizar.
    echo.
)

:update
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
    git stash list | findstr /C:"Cambios" >nul
    if %errorLevel% equ 0 (
        echo [INFO] Se detectaron cambios guardados en stash.
        echo.
        echo Quieres restaurar tus cambios locales?
        echo 1. Si, restaurar cambios ahora
        echo 2. No, mantenerlos en stash para despues
        echo.
        
        choice /C 12 /N /M "Selecciona [1 o 2]: "
        
        if errorlevel 2 (
            echo.
            echo [INFO] Cambios guardados en stash.
            echo [INFO] Para verlos: git stash list
            echo [INFO] Para restaurarlos: git stash pop
            echo.
        )
        
        if errorlevel 1 (
            echo.
            echo [INFO] Restaurando cambios locales...
            git stash pop
            if %errorLevel% neq 0 (
                echo.
                echo [WARNING] Hubo conflictos al restaurar cambios.
                echo.
                echo Los cambios siguen guardados en el stash.
                echo Para resolverlos manualmente:
                echo   1. Resuelve los conflictos en los archivos
                echo   2. Usa: git add ^<archivo^>
                echo   3. Usa: git stash drop (para eliminar del stash)
                echo.
            ) else (
                echo [OK] Cambios locales restaurados correctamente.
                echo.
            )
        )
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
