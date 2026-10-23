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

From the repository root, the equivalent commands are also available:

```powershell
npm run dev
npm run build
```

Frontend: `http://localhost:5173`  
API health check: `http://localhost:5000/api/health`

## AI scoring guidance

The match score itself is calculated locally with TF-IDF, cosine similarity,
and skill matching. The backend uses Gemini to tailor the score explanation and
resume recommendations when a key is available. Configure the key either as
`GEMINI_API_KEY` in `backend/.env`, or place it in `backend/api_key` as a
single line such as `Gemini: YOUR_KEY`. The key file is ignored by Git.
The default model is `gemini-3.8-flash`; override it with `GEMINI_MODEL` if
your project uses a different Gemini model.

If Gemini is unavailable, scoring continues with the built-in deterministic
explanation and recommendations.

## Email sign-in testing

The login form uses Supabase Auth with an email address and password. A Gmail
address can be used as a normal email address; this does not use Google OAuth.

1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to
   `frontend/.env.local`.
2. Add `VITE_API_BASE_URL=http://localhost:5000` to `frontend/.env.local`
   unless the backend is running at a different address.
3. In Supabase, enable the Email provider.
4. Configure the Supabase confirmation email template to include the numeric
   token (`{{ .Token }}`), because the app asks for that code after account
   creation.
5. Run both the backend and frontend, choose **Create an account**, and enter the Gmail
   address. Enter the code delivered to that inbox, then sign in with the
   same email and password.