# 🛡️ SecureOps Lite

A lightweight full-stack incident tracking dashboard. Log security incidents, browse them with severity tags, and filter or sort to find what matters.

**Live demo:** _coming soon_

## Tech Stack

- **Frontend:** React (Vite), plain CSS
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Vercel (frontend) + Render (backend) + Supabase (DB)

## Features

- **Incident creation** — title, description, severity (Low / Medium / High)
- **Dashboard** — all incidents with severity tags, filter by severity, sort by date or severity
- **Incident detail view** — full incident details
- **Zero-setup local mode** — runs on an in-memory store when no database is configured

## API

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| GET    | `/health`        | Health check          |
| GET    | `/incidents`     | List all incidents    |
| GET    | `/incidents/:id` | Get a single incident |
| POST   | `/incidents`     | Create an incident    |

## Running locally

### Backend

```bash
cd backend
npm install
npm run dev            # http://localhost:4000
```

Optional: copy `.env.example` to `.env` and set `DATABASE_URL` to use Postgres. Without it, the backend uses an in-memory store (data resets on restart).

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Deployment

1. **Supabase** — create a project, copy the Postgres connection string. The backend creates the `incidents` table automatically on startup.
2. **Render** — create a Web Service from this repo (root dir `backend`), or use the included `render.yaml`. Set `DATABASE_URL` and `FRONTEND_ORIGIN` (your Vercel URL).
3. **Vercel** — import the repo, set root dir to `frontend`, and set `VITE_API_URL` to your Render backend URL.

## Screenshots

_Add screenshots here: dashboard, incident form, detail view._
