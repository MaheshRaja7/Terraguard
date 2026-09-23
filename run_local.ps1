Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TERRAGUARD AI — NER Landslide Early Warning System" -ForegroundColor Yellow
Write-Host "  Smart India Hackathon 2026 (SIH26001)" -ForegroundColor Green
Write-Host "  'Predict Risk. Warn Early. Protect Communities.'" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --reload --port 8000"

Write-Host "[2/2] Starting Next.js EOC Frontend on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location frontend; npm run dev"

Write-Host "`nBoth services are active!" -ForegroundColor Cyan
Write-Host "• Frontend EOC Command Center: http://localhost:3000" -ForegroundColor White
Write-Host "• Backend Swagger API Docs:    http://localhost:8000/docs" -ForegroundColor White
