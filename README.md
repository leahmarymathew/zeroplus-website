# Zeroplus — E-Commerce Platform

Online store for Zeroplus, a baby products shop in Kothamangalam, Kerala.

## Structure

- `/frontend` — Next.js customer site + admin panel (Next.js, TypeScript, Tailwind CSS)
- `/backend` — Express API (Node.js, TypeScript, Prisma, PostgreSQL)

## Getting Started

### Frontend
```
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Backend
```
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Branching

- `main` is always deployable
- One branch per task: `feature/<description>` or `fix/<description>`
- Open a pull request into `main`, get one review, squash and merge

See the project plan doc for the full API contract, data model, and git workflow.

## Environment Variables

Real secrets go only in local `.env` files (git-ignored) and in the hosting
platform's dashboard for production. See `.env.example` in each folder for
required variable names.
