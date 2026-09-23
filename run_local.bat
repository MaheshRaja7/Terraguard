@echo off
echo ============================================================
echo   TERRAGUARD AI — NER Landslide Early Warning System
echo   Smart India Hackathon 2026 (SIH26001)
echo   "Predict Risk. Warn Early. Protect Communities."
echo ============================================================
echo.

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "TerraGuard Backend" cmd /k "python -m uvicorn backend.app.main:app --reload --port 8000"

echo [2/2] Starting Next.js EOC Frontend on http://localhost:3000 ...
start "TerraGuard Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are launching in separate windows!
echo Backend API Docs: http://localhost:8000/docs
echo EOC Command Center: http://localhost:3000
echo.
pause
