# Backend

Express + Better Auth + Drizzle + Postgres.

## Setup

```bash
npm install
cp .env.example .env
```

## Run

```bash
npm run dev
```

API runs at `http://localhost:3000`.

## Database

```bash
npm run db:migrate
npm run seed
```

## Scripts

- `npm run dev` - start backend in watch mode
- `npm run type-check` - run TypeScript checks
- `npm run format` - format backend files
- `npm run format:check` - check formatting only
- `npm run db:migrate` - apply Drizzle migrations
- `npm run db:generate` - generate migration files from schema
- `npm run db:push` - push schema directly to DB
- `npm run db:studio` - open Drizzle Studio
- `npm run seed` - create default test user

## Notes

- Requires Postgres from the repo `docker-compose.yml`.
- Seed user credentials are defined in `src/scripts/seed.ts`.
