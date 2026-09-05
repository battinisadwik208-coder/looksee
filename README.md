# Looksee — AI image analysis

A full-stack website for general image understanding and visible component identification. Upload a JPG/PNG/WebP image and receive a concise OpenRouter-powered visual analysis.

## Run locally

1. Create `backend/.env` by copying `backend/.env.example`, then add an OpenRouter API key.
2. In a terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3. In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Render + Vercel setup.

## Safety

Looksee describes visible content and components. It does not diagnose faults, recommend repairs, confirm compatibility, or replace a qualified technician. Never commit `backend/.env` or any API key.
