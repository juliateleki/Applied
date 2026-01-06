# Applied

Applied is a feedback-driven job application tracker that helps users understand which inputs lead to better outcomes — not just where their applications stand.

## Why “Applied”?

Job searching is often treated as a numbers game, but outcomes depend heavily on the inputs we choose: resume versions, application sources, and follow-ups. Applied emphasizes intentional action and learning from results, helping users iterate thoughtfully rather than blindly.

## Key Features (MVP)

- Authentication (email + password)
- Job application CRM
  - Create, edit, search, and filter applications
  - Track status changes over time using a timeline of touchpoints
- Artifacts
  - Track resume versions and cover letter templates
  - Attach artifacts to applications to measure outcomes by “inputs”
- Analytics Dashboard
  - Response rate by source and by resume version
  - Funnel conversion (Applied → Screen → Interview → Offer)
  - Time-to-first-response (median + distribution)

## Tech Stack

Frontend

- React + TypeScript (Vite)
- TanStack Query (server state)
- React Hook Form + Zod (forms + validation)
- Recharts (analytics charts)

Backend

- FastAPI (Python)
- SQLAlchemy + Alembic (PostgreSQL migrations)
- JWT auth (access + refresh)

Database

- PostgreSQL

Deployment

- Web: Vercel
- API: Render or Railway
- DB: Render/Railway Postgres (or Neon)

## Architecture

High level:

- React client calls FastAPI REST endpoints
- FastAPI reads/writes PostgreSQL
- Analytics are computed server-side (SQL aggregations), exposed via dedicated endpoints

See `docs/architecture.md` for diagrams and decisions.

## Repo Structure

- `apps/web` — React frontend
- `apps/api` — FastAPI backend
- `docs` — architecture notes, analytics definitions, and design decisions

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (recommended for Postgres)

### 1) Environment variables

Copy the example env and fill in values:

```bash
cp .env.example .env
```
