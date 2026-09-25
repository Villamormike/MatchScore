# MatchScore

MatchScore is a web application for building a resume, comparing it with a job
posting, and generating match guidance. The project uses React with TypeScript
for the frontend and Flask with SQLite planned for the backend.

## Project structure

- `frontend/` - Vite React TypeScript application
- `backend/` - Flask API
- `*.pdf` - project requirements and design documents

## Run locally

Start the API in one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`  
API health check: `http://localhost:5000/api/health`