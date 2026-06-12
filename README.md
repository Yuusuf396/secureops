# 🛡️ SecureOps Lite

Full-stack incident management platform with AI-powered risk analysis. Log security incidents, view them in a dashboard, and generate AI summaries, risk classifications, and suggested mitigations for each one.

**Live demo:** _coming soon_

## Tech Stack

- **Frontend:** React (Vite), plain CSS
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL (Supabase)
- **AI:** Groq API (Llama 3.3 70B, free tier)
- **Deployment:** Vercel (frontend) + Render (backend) + Supabase (DB)

## Features

- **Incident creation** — title, description, severity (Low / Medium / High)
- **Live overview** — stats strip with total, high-severity, open, and AI-analyzed counts
- **Dashboard** — severity and status tags, free-text search, filter by severity, sort by date or severity
- **Incident lifecycle** — track each incident through Open → Investigating → Resolved
- **AI risk analysis** — one click generates a short summary, a risk classification, and a suggested mitigation action, stored on the incident

## API

| Method | Endpoint         | Description                                  |
| ------ | ---------------- | -------------------------------------------- |
| GET    | `/health`        | Health check                                 |
| GET    | `/incidents`     | List all incidents                           |
| GET    | `/incidents/:id` | Get a single incident                        |
| POST   | `/incidents`     | Create an incident                           |
| PATCH  | `/incidents/:id` | Update incident status                       |
| POST   | `/ai/summarize`  | Run AI analysis for an incident (by id)      |

## Running locally

### Backend

```bash
cd backend
cp .env.example .env   # add your DATABASE_URL and GROQ_API_KEY
npm install
npm run dev            # http://localhost:4000
```

No `DATABASE_URL`? The backend falls back to an in-memory store so you can try it instantly (data resets on restart).

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Deployment

1. **Supabase** — create a project, copy the Postgres connection string. The backend creates the `incidents` table automatically on startup.
2. **Render** — create a Web Service from this repo (root dir `backend`), or use the included `render.yaml`. Set `DATABASE_URL`, `GROQ_API_KEY`, and `FRONTEND_ORIGIN` (your Vercel URL).
3. **Vercel** — import the repo, set root dir to `frontend`, and set `VITE_API_URL` to your Render backend URL.

## Screenshots

<img width="1508" height="773" alt="image" src="https://github.com/user-attachments/assets/543dde6d-d52e-465c-ae4a-1d9fec2258a2" />
<img width="1511" height="766" alt="image" src="https://github.com/user-attachments/assets/2415afd8-4668-4743-8546-8abd2cf54961" />

