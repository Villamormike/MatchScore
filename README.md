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

## Email sign-in testing

The login form uses Supabase Auth with an email address and password. A Gmail
address can be used as a normal email address; this does not use Google OAuth.

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to
   `frontend/.env.local`.
2. In Supabase, enable the Email provider.
3. Configure the Supabase confirmation email template to include the numeric
   token (`{{ .Token }}`), because the app asks for that code after account
   creation.
4. Run the frontend, choose **Create an account**, and enter the Gmail
   address. Enter the code delivered to that inbox, then sign in with the
   same email and password.