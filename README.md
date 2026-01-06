# Applied

Applied is a feedback-driven job application tracker that helps users understand which inputs lead to better outcomes — not just where their applications stand.

---

## Why "Applied"?

Job searching is often treated as a numbers game, but outcomes depend heavily on the inputs we choose: resume versions, application sources, and follow-ups. **Applied** emphasizes intentional action and learning from results, helping users iterate thoughtfully rather than blindly.

---

## Tech Stack

**Frontend**

- React + TypeScript (Vite)
- TanStack Query
- React Hook Form + Zod
- Recharts

**Backend**

- FastAPI (Python)
- SQLAlchemy + Alembic
- PostgreSQL
- JWT authentication

**Infrastructure**

- Docker + Docker Compose (local)
- Web: Vercel (planned)
- API: Render / Railway (planned)

---

## Repo Structure

```
applied/
  apps/
    web/        # React frontend (Vite)
    api/        # FastAPI backend
  docs/         # Architecture & design notes
  docker-compose.yml
  .nvmrc
  README.md
```

---

## Prerequisites

You will need:

- **Node.js 20+ (LTS required)**
- **npm**
- **Docker Desktop** (running)
- **Python 3.11+** (for API development)

### Node version (important)

This project requires **Node 20 LTS**. Node 21 is not supported by Vite.

We use **nvm** to manage Node versions.

```bash
nvm install 20
nvm use 20
```

The repo includes an `.nvmrc` file, so you can simply run:

```bash
nvm use
```

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/applied.git
cd applied
```

---

### 2. Start Postgres with Docker

Make sure Docker Desktop is running, then from the **repo root**:

```bash
docker compose up -d db
```

This starts a local PostgreSQL instance on port `5432`.

---

### 3. Frontend setup (React)

```bash
cd apps/web
npm install
npm run dev
```

Frontend will be available at:

```
http://localhost:5173
```

> ⚠️ Important: `npm run dev` must be run from `apps/web`, not the repo root.

---

### 4. Backend setup (FastAPI)

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .
```

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql+psycopg://applied:applied@localhost:5432/applied
JWT_SECRET=dev-secret
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=14
CORS_ORIGINS=http://localhost:5173
```

Run migrations and start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API will be available at:

```
http://localhost:8000
http://localhost:8000/docs
```

---

## Common Issues

### "npm run dev" fails with ENOENT

Make sure you are inside `apps/web`:

```bash
cd apps/web
npm run dev
```

---

### Vite crypto / Node errors

If you see errors like:

```
crypto.hash is not a function
```

You are likely using an unsupported Node version. Run:

```bash
nvm use
```

---

### Docker cannot connect to daemon

Ensure **Docker Desktop is running** before executing:

```bash
docker compose up
```

---

## Product Principles

- Calm UX, no gamification
- Learning-focused analytics
- Inputs → outcomes modeling
- Privacy-first and exportable data

---

## Roadmap

- Analytics dashboard (response rates, funnel conversion)
- Resume & cover letter artifact tracking
- CSV / JSON export
- Experiment mode (compare strategies over time)

---

## License

MIT
