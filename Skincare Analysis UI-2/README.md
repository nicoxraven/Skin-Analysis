# Lumina — Skin Analysis & Care Recommender

School project: AI skin analysis + personalized skincare recommendations + SQLite CRUD admin.

## Why the editor was closing

Your machine was low on RAM/disk, and Cursor was indexing:

- `backend/myenv/` (~2.6 GB Python venv)
- `backend/ai/models/*.h5` (~174 MB)

Those are now excluded via `.cursorignore`. **Reload the Cursor window** after opening this folder.

Also open the inner project folder (`Skincare Analysis UI-2`), not the parent wrapper folder.

## Do I need `src/services/ai.js` and `api.js`?

**Yes.**

| File | Role |
|------|------|
| `api.js` | Auth + Database CRUD calls to FastAPI (`/api/auth/*`, `/api/admin/*`, progress) |
| `ai.js` | Sends selfie to `/api/user/analyze` and maps AI JSON for the UI |

Without them the frontend cannot talk to the backend.

## Run the project

### 1) Backend (terminal A)

```bash
cd backend
source myenv/bin/activate   # or: python3 -m venv myenv && pip install ...
python seed.py              # first time only — products & ingredients
uvicorn main:app --reload --port 8000
```

### 2) Frontend (terminal B)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### Demo accounts

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| User  | demo@example.com   | password123 |
| Admin | admin@lumina.com   | admin123    |

Admin register secret code: `admin123`

## Project map

```
src/app/App.jsx              # shell / routing between views
src/app/components/          # Login, Upload, Results, Admin pages
src/services/api.js          # CRUD + auth
src/services/ai.js           # AI analyze bridge
backend/main.py              # FastAPI routes
backend/database.py          # SQLAlchemy models (SQLite)
backend/ai/predict.py        # model inference + recommender
```
