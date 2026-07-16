@echo off
setlocal
cd /d "%~dp0"

set PORT=8027
set CACHE_BUSTER=%RANDOM%%RANDOM%
set URL=http://localhost:%PORT%/index.html?v=%CACHE_BUSTER%

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    echo Cerrando la instancia anterior del juego en el puerto %PORT%...
    taskkill /PID %%P /F >nul 2>&1
)

echo Iniciando ATB Formations en %URL%
echo No abras index.html con doble clic. Usa esta ventana para mantener activo Vite.
echo Cierra esta ventana para detener el servidor.
echo.

where npm >nul 2>&1
if %errorlevel%==0 (
    start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
    call npm run dev
    pause
    exit /b 0
)

echo.
echo ERROR: npm no esta instalado o no esta agregado al PATH.
echo Instala Node.js LTS, ejecuta npm install y vuelve a intentar.
pause
exit /b 1
