# MatchScore

MatchScore is a resume and job-posting matching application. Users can upload or
edit a resume, compare it with a job posting, review deterministic match results,
receive AI-assisted recommendations, and save their documents and score history
to their account.

## Project structure

- `frontend/` - Vite React TypeScript application
- `backend/` - Flask API, document parsing, scoring, and AI guidance
- `supabase/` - database schema and account-persistence setup
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

## Implemented functionality

- Supabase email/password authentication and email verification
- Remembered email address without storing passwords
- PDF, DOCX, and TXT resume upload and parsing
- Resume editor with formatting and export support
- Built-in templates, blank custom templates, and AI-generated layouts
- TF-IDF, cosine similarity, matched terms, missing terms, and partial matches
- Automatic job-role and company detection from job postings
- AI explanations and section-targeted recommendations
- Individual recommendation application and whole-resume AI improvement
- Automatic re-scoring after an AI improvement
- Saved documents and score history through Supabase
- Search, notifications, account switching, logout, and dark mode

The recommendations screen identifies the target role, company, and resume file
used for each score. Notifications report completed scoring, AI fallbacks,
successful improvements, and AI failures.

## AI scoring guidance

The match score itself is calculated locally with TF-IDF, cosine similarity,
and skill matching. The backend uses Gemini to tailor the score explanation and
resume recommendations when a key is available. Configure keys only through local environment variables or the ignored
`backend/api_key` file. Never place real keys, Supabase secrets, private URLs,
or account data in this README, source code, screenshots, or commits.

Supported configuration options are `GEMINI_API_KEYS`,
`GEMINI_API_KEY`, `GEMINI_MODEL`, and `GEMINI_FALLBACK_MODEL`. Keys may also be
listed in `backend/api_key`; that file is ignored by Git. Keys are tried in
order when a request fails.

If Gemini is unavailable, scoring continues with the built-in deterministic
explanation and recommendations.

Multiple keys from the same provider project may share quota or experience the
same outage. Key rotation cannot guarantee additional capacity in that case.

## Validation

Run the frontend production build:

```powershell
cd frontend
npm run build
```

Run the backend API and AI-guidance tests:

```powershell
cd backend
python -m pytest test_api.py test_ai_guidance.py
```

The tested manual workflow is:

1. Sign in or create an account.
2. Upload or select a saved resume.
3. Paste a job posting and compute the match score.
4. Review the detected role, company, score, and recommendations.
5. Apply a recommendation or improve the full resume with AI.
6. Confirm the edited document and score history remain available after reopening.

## Intentional limitations

- No production deployment is included; the project is configured for local
  development and demonstration.
- The Flask history endpoints use in-memory state for API demonstrations.
  Authenticated frontend history is persisted through Supabase.
- No separate browser automation suite is included. Backend tests, production
  builds, and manual end-to-end validation cover the current workflow.
- Gemini output depends on the external provider. Deterministic scoring and
  recommendations remain available when Gemini is unavailable.
- AI cannot invent truthful experience, skills, projects, or measurable results.
  If no meaningful improvement is possible, the application asks the user to
  add more information.

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
