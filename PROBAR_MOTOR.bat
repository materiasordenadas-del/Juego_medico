@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Node.js no esta instalado o no esta agregado al PATH.
  echo Instala Node.js LTS para ejecutar la validacion clinica.
  pause
  exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: npm no esta disponible.
  pause
  exit /b 1
)

call npm run check
pause
