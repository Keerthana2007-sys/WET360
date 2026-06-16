@echo off
echo ==================================================
echo Starting WET360 Platform Dev Server...
echo ==================================================

:: Install backend dependencies if not done
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

:: Start default browser to portal
start http://localhost:3000

:: Run backend dev server
call npm run dev
