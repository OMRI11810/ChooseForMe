# Deploying ChooseForMe

**Architecture:** Vercel hosts the static React build (frontend) · Railway hosts the FastAPI API and its PostgreSQL database (backend). The frontend calls the backend directly via `VITE_API_URL`; the backend allows that origin via CORS.

```
Phone / browser ──▶ https://<app>.vercel.app        (Vercel: static SPA)
                        │  fetch(VITE_API_URL + /api/…)
                        ▼
                    https://<app>.up.railway.app    (Railway: uvicorn + FastAPI)
                        │  SQLAlchemy / Alembic
                        ▼
                    Railway PostgreSQL
```

## 1. Railway — backend + database

1. Make sure the repo is pushed to GitHub (`origin` is already configured).
2. On [railway.com](https://railway.com): **New Project → Deploy from GitHub repo** → select this repository.
3. In the new service: **Settings → Root Directory = `backend`** (Nixpacks then installs `backend/requirements.txt` and reads `backend/railway.toml`).
4. In the project canvas: **+ Create → Database → PostgreSQL**.
5. Backend service → **Variables** tab, add:

   | Variable | Value |
   |---|---|
   | `CHOOSEFORME_DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `CHOOSEFORME_CORS_ORIGIN_REGEX` | `https://.*\.vercel\.app` |
   | `CHOOSEFORME_CORS_ORIGINS` | `["https://YOUR-FRONTEND.vercel.app"]` (set after step 7) |

   `${{Postgres.DATABASE_URL}}` is a Railway reference that injects the Postgres service's connection URL automatically — if your Postgres service has a different name (e.g. `Postgres-1`), adjust accordingly.
6. Deploy. The start command runs `alembic upgrade head` (creates `decisions` + `options`) and then serves uvicorn on Railway's injected `PORT`.
7. **Settings → Networking → Generate Domain** — Railway gives you a public URL like `https://chooseforme-backend-production.up.railway.app`. **This is your API URL** — save it for Vercel. Verify: `https://<railway-url>/api/health` → `{"status":"ok"}`.

> **No-Postgres alternative:** attach a Volume to the backend (mount path `/data`) and set `CHOOSEFORME_DATABASE_URL=sqlite:////data/chooseforme.db` instead of steps 4–5's URL.

## 2. Vercel — frontend

1. On [vercel.com](https://vercel.com): **Add New → Project** → import the same GitHub repo.
2. Configure: **Root Directory = `frontend`** (framework auto-detects as Vite; the included `vercel.json` adds the SPA rewrite so deep links like `/decisions/3` work when opened on the phone).
3. **Environment Variables** (all environments):

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-railway-url>` — no trailing slash |

4. **Deploy**, then open `https://<project>.vercel.app` on your phone. Optional: share sheet → *Add to Home Screen* for an app icon.

## 3. Order, updates, notes

- Deploy the **backend first** — `VITE_API_URL` is baked into the JS bundle at build time, so the backend URL must exist before the frontend builds.
- Changing `VITE_API_URL` requires a frontend **redeploy**; backend variable changes redeploy the backend automatically.
- `alembic upgrade head` runs on every backend start — future schema migrations ship automatically with each deploy.
- Every Vercel preview URL (`*.vercel.app` PR deployments) is already allowed via `CHOOSEFORME_CORS_ORIGIN_REGEX`. For other frontend hosts, add the exact origin to `CHOOSEFORME_CORS_ORIGINS` (JSON array format).
- `CHOOSEFORME_CORS_ORIGINS` must be valid JSON, e.g. `["https://a.vercel.app","https://b.vercel.app"]`.

## 4. Local development — unchanged

`npm run dev` works exactly as before: no env vars needed (Vite proxies `/api` → `localhost:8000`, and the backend's default CORS already allows `localhost:5173`).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser console CORS error | The frontend's exact origin is missing on the backend → add it to `CHOOSEFORME_CORS_ORIGINS` (JSON array) and redeploy Railway |
| `relation "decisions" does not exist` in logs | `alembic upgrade head` failed → check `CHOOSEFORME_DATABASE_URL` points at the Postgres service and check deploy logs |
| App loads but network errors on actions | `VITE_API_URL` missing/typo → must be the Railway URL **without** trailing slash, then redeploy Vercel |
| Railway deploy fails at build | Confirm **Root Directory = `backend`** and `requirements.txt` is committed |
| Build fails on psycopg2 / no matching wheel | `backend/.python-version` pins Python **3.12** (psycopg2-binary 2.9.10 has no wheels for 3.14) — keep it in place |
| Vercel deep links 404 | `frontend/vercel.json` missing → it must be committed and the project root must be `frontend` |