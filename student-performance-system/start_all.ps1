# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm install; npm run dev" -WindowStyle Normal

# Start ML API
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-api; if (!(Test-Path venv)) { python -m venv venv }; .\venv\Scripts\activate; pip install -r requirements.txt; python app.py" -WindowStyle Normal

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev" -WindowStyle Normal

Write-Host "All services are starting up in separate windows..."
