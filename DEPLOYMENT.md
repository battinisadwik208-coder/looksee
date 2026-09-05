# Deploy Looksee publicly

## Important

Deploy the backend first. Never put `OPENROUTER_API_KEY` in the frontend or commit `backend/.env`.

## 1. Push the project to GitHub

Create a new GitHub repository named `looksee`, keep it private if preferred, and upload this project folder. Confirm `backend/.env` is not included.

## 2. Deploy the backend on Render

- Create a new **Web Service** from the GitHub repository.
- Root Directory: `backend`
- Runtime: `Python 3`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`
- Add environment variables:
  - `OPENROUTER_API_KEY` — add the key directly in Render; never commit it
  - `OPENROUTER_MODEL` — `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
  - `CORS_ORIGINS` — temporarily use `*`, then replace with the final Vercel URL
- Copy the Render URL, for example `https://looksee-api.onrender.com`.

## 3. Deploy the frontend on Vercel

- Import the same GitHub repository.
- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Add environment variable:
  - `VITE_API_URL` — the Render backend URL, with no trailing slash
- Deploy and copy the Vercel URL.

## 4. Lock CORS to Vercel

Return to Render and change `CORS_ORIGINS` from `*` to the exact Vercel URL, for example:

`https://looksee.vercel.app`

Redeploy the backend.

## 5. Smoke test

- Open the Vercel URL in a private browser window.
- Test a general image.
- Test Identify parts with a clear engine/component photo.
- Check the Render `/health` endpoint.
- Confirm the browser does not show CORS errors.

## Free-plan expectation

Vercel serves the frontend continuously under the account/project limits. Render's free backend may sleep after inactivity, so the first request after a quiet period can be slow. Free OpenRouter models can also be rate-limited. This is suitable for a demo/portfolio MVP, not a guaranteed always-on production service.
