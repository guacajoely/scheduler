# Frontend

React + Vite + TypeScript + Tailwind.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts

- `npm run dev` - start dev server
- `npm run type-check` - run TypeScript checks
- `npm run format` - format source and common project files
- `npm run format:check` - verify formatting without writing changes
- `npm run lint` - run ESLint
- `npm run build` - type-check and build
- `npm run preview` - preview production build

## Notes

- Frontend API URL is configured with `VITE_API_BASE_URL` (required).
- Keep full-stack/local setup instructions in the repo root `README.md`.
