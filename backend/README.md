# MatchScore API

The backend is a Flask application. Create a virtual environment, install the
dependencies, and start the development server:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

The initial health check is available at `http://localhost:5000/api/health`.