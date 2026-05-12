# Scheduler

Full-stack scheduler app.

- `frontend/`: React + Vite + Tailwind
- `backend/`: Express + Better Auth + Drizzle
- `docker-compose.yml`: local Postgres DB

## Local Setup

### 1) Start Postgres

```bash
docker compose up -d
```

### 2) Setup and run backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run seed
npm run dev
```

Backend runs at `http://localhost:3000`.

### 3) Setup and run frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Default Seed Login

- Email: `test@email.com`
- Password: `password`

## Repo Scripts

Run scripts from each package directory:

- Frontend docs: `frontend/README.md`
- Backend docs: `backend/README.md`
