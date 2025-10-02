@echo off
echo ================================================
echo   INICIANDO WILSON POS SYSTEM
echo ================================================
echo.
echo [1/3] Iniciando Backend en puerto 3001...
echo [2/3] Iniciando Frontend en puerto 3000...
echo [3/3] Abriendo Chrome automaticamente...
echo.
echo Espera unos segundos...
echo.
echo IMPORTANTE: NO CIERRES ESTA VENTANA
echo Para detener el servidor presiona Ctrl+C
echo ================================================
echo.

REM Iniciar backend en una nueva ventana
start "Backend - Puerto 3001" cmd /k "cd backend && npm run dev"
echo [OK] Backend iniciado!

REM Esperar 5 segundos
timeout /t 5 /nobreak >nul

REM Iniciar frontend en una nueva ventana
start "Frontend - Puerto 3000" cmd /k "cd frontend && npm run dev"
echo [OK] Frontend iniciado!

REM Esperar 10 segundos para que el frontend compile
echo.
echo Esperando a que el servidor compile... (10 segundos)
timeout /t 10 /nobreak >nul

REM Abrir Chrome automaticamente
echo.
echo [OK] Abriendo Chrome...

REM Intentar abrir con Chrome (varias ubicaciones posibles)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
) else (
    REM Si Chrome no esta instalado, usar el navegador por defecto
    echo Chrome no encontrado, abriendo navegador por defecto...
    start http://localhost:3000
)

echo.
echo ================================================
echo   WILSON POS SYSTEM INICIADO EXITOSAMENTE!
echo ================================================
echo.
echo URLs disponibles:
echo   - Frontend: http://localhost:3000
echo   - Backend:  http://localhost:3001
echo.
echo Las ventanas del servidor se abrieron por separado.
echo Chrome se abrio automaticamente con la aplicacion.
echo.
echo Para detener todo: Cierra las ventanas del servidor
echo ================================================
echo.
pause
