@echo off
echo ===================================================
echo   RythuSethu Project Startup Script (Windows)
echo ===================================================
echo.

echo [1/3] Starting Backend Server...
cd backend
start cmd /k "npm install && npm run dev"
cd ..
timeout /t 3 /nobreak > nul

echo [2/3] Starting FastAPI ML Server...
cd backend/ml_api
start cmd /k "pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000"
cd ../..
timeout /t 3 /nobreak > nul

echo [3/3] Starting Frontend React App...
cd frontend
start cmd /k "npm install && npm run dev"
cd ..

echo.
echo ===================================================
echo   All services have been started in new windows!
echo   - Frontend: http://localhost:5173
echo   - Backend API: http://localhost:5000
echo   - ML API: http://localhost:8000
echo ===================================================
pause
