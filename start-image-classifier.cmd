@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"

echo.
echo ==========================================
echo   Starting Looksee Image Analysis
 echo ==========================================
echo.

if not exist "%ROOT%backend\.env" (
  echo ERROR: backend\.env is missing.
  echo Put your OpenRouter key in backend\.env first.
  pause
  exit /b 1
)

findstr /C:"PASTE_YOUR_OPENROUTER_KEY_HERE" "%ROOT%backend\.env" >nul
if not errorlevel 1 (
  echo ERROR: Replace the OpenRouter API-key placeholder in backend\.env first.
  pause
  exit /b 1
)

if not exist "%ROOT%backend\.venv\Scripts\python.exe" (
  echo Setting up Python. This only happens the first time.
  python -m venv "%ROOT%backend\.venv"
  if errorlevel 1 goto failed
)

"%ROOT%backend\.venv\Scripts\python.exe" -c "import fastapi, PIL" >nul 2>nul
if errorlevel 1 (
  echo Installing Python packages. This only happens the first time.
  "%ROOT%backend\.venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt"
  if errorlevel 1 goto failed
)

if not exist "%ROOT%frontend\node_modules" (
  echo Installing website packages. This only happens the first time.
  pushd "%ROOT%frontend"
  call npm install
  if errorlevel 1 (popd & goto failed)
  popd
)

echo Starting the API and website...
start "Looksee API - keep this window open" cmd /k "cd /d ""%ROOT%backend"" && ""%ROOT%backend\.venv\Scripts\python.exe"" -m uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
start "Looksee Website - keep this window open" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"
timeout /t 3 /nobreak >nul
start "" http://localhost:5173

exit /b 0

:failed
echo.
echo Setup failed. Send Atlas the error text displayed above.
pause
exit /b 1
