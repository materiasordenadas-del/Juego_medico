@echo off
setlocal
cd /d "%~dp0"

set PORT=8017
set CACHE_BUSTER=%RANDOM%%RANDOM%
set URL=http://localhost:%PORT%/index.html?v=%CACHE_BUSTER%

echo Iniciando ATB Formations en %URL%
echo No abras index.html con doble clic. Usa esta ventana para mantener activo el servidor.
echo Cierra esta ventana para detener el servidor.
echo.

where py >nul 2>&1
if %errorlevel%==0 (
    start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
    py -m http.server %PORT%
    pause
    exit /b 0
)

where python >nul 2>&1
if %errorlevel%==0 (
    start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
    python -m http.server %PORT%
    pause
    exit /b 0
)

echo.
echo ERROR: Python no esta instalado o no esta agregado al PATH.
echo Instala Python 3 y vuelve a ejecutar este archivo.
pause
exit /b 1
