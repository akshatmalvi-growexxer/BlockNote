# BlockNote

Browser-based block document editor built for the internship practical assignment.

## Phase Status

- [x] Subphase 1.1: Architecture finalized
- [x] Subphase 1.2: Project setup
- [x] Subphase 1.3: Database design

## Chosen Stack

- Frontend: Next.js
- Backend: Express.js
- ORM: Prisma
- Database: PostgreSQL
- Frontend deployment: Vercel
- Backend deployment: Render
- Database deployment: Render PostgreSQL

## Architecture Summary

This repository uses a monorepo structure so the frontend and backend can evolve independently while still sharing one Git history and one submission repo.

- `apps/web`: Next.js frontend for auth screens, dashboard, editor, and public share page
- `apps/api`: Express REST API for auth, documents, blocks, sharing, and persistence rules
- `docs`: project planning and architecture notes

The backend owns Prisma and all database access. The frontend talks to the backend only through HTTP APIs. This keeps the architecture aligned with the assignment requirement of a REST backend and makes deployment cleaner on Vercel + Render.

Architecture notes live in:

- `docs/architecture.md`
- `docs/system-design.md`
- `docs/setup.md`
- `docs/data-model.md`

## Current Focus

The workspace, deployment setup, and schema design are in place. The next phase is implementation.

## Setup Snapshot

- Monorepo workspace configured at the root
- Next.js app scaffolded in `apps/web`
- Express API scaffolded in `apps/api`
- Root `.env.example` added for local and deployment configuration
- `render.yaml` added as the initial backend and database deployment blueprint
