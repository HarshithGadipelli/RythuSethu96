@echo off
echo ===================================================
echo     Rythu Sethu - One-Click Installer ^& Runner
echo ===================================================
echo.

echo [Step 0/5] Ensuring MongoDB Service is active...
net start MongoDB >nul 2>&1 || sc start MongoDB >nul 2>&1
echo MongoDB check completed.

echo.
echo [Step 1/5] Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo.
echo [Step 2/5] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [Step 3/5] Installing Python ML Dependencies...
cd ml_models
pip install -r requirements.txt
cd ..

echo.
echo [Step 4/5] Training Machine Learning Models locally...
echo (This will generate the required .pkl model files)
cd ml_models\training
python train_model.py
cd ..\..

echo.
echo [Step 5/5] Skipping Database Import (Database auto-seeds on startup)

echo.
echo ========================================================
echo     Launching Services in 3 Terminals...
echo ========================================================
echo.

:: 1. Launch Terminal 1: MongoDB Service Status & Monitor
echo [1/3] Launching MongoDB Terminal...
start "Rythu Sethu - MongoDB (Port 27017)" cmd /k "title Rythu Sethu - MongoDB (Port 27017) && echo ======================================================== && echo  Rythu Sethu: MongoDB Service (Port 27017) && echo ======================================================== && net start MongoDB 2>nul || sc query MongoDB && echo. && echo [STATUS] MongoDB Service is running on port 27017. && echo Keep this window open or close when finished. && echo."

:: 2. Launch Terminal 2: Backend Server (Node.js/Express)
echo [2/3] Launching Backend Server Terminal (Port 5000)...
start "Rythu Sethu - Backend (Port 5000)" cmd /k "title Rythu Sethu - Backend (Port 5000) && cd /d "%~dp0backend" && echo ======================================================== && echo  Rythu Sethu: Backend Server (Port 5000) && echo ======================================================== && npm.cmd run dev"

:: 3. Launch Terminal 3: Frontend Client (Vite/React)
echo [3/3] Launching Frontend Client Terminal (Port 3000)...
start "Rythu Sethu - Frontend (Port 3000)" cmd /k "title Rythu Sethu - Frontend (Port 3000) && cd /d "%~dp0frontend" && echo ======================================================== && echo  Rythu Sethu: Frontend Client (Port 3000) && echo ======================================================== && npm.cmd run dev"

echo.
echo ===================================================
echo Success! Rythu Sethu 4.0 is booting up!
echo - MongoDB:  Port 27017
echo - Backend:  http://localhost:5000
echo - Frontend: http://localhost:3000 (or http://localhost:5173)
echo ===================================================
pause
