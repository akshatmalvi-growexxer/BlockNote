# Setup Notes

## Workspace Layout

- `apps/web`: Next.js frontend
- `apps/api`: Express backend
- root `.env.example`: shared environment contract for local and hosted environments

## Local Development Plan

Frontend and backend run as separate processes:

- frontend on `http://localhost:3000`
- backend on `http://localhost:4000`

This mirrors the production separation between Vercel and Render.

## Environment Variable Strategy

The repository keeps a single root `.env.example` so the expected variables are easy to audit during review.

Current variables cover:

- frontend public URLs
- backend port and allowed frontend origin
- JWT configuration placeholders
- database URL placeholder

No real secrets are committed. Actual credentials will be provided later through local `.env` files and deployment dashboards.

## Deployment Direction

### Vercel

- deploys `apps/web`
- uses `NEXT_PUBLIC_API_URL` to talk to the Express backend

### Render

- deploys `apps/api`
- provisions PostgreSQL for production through Render

The included `render.yaml` is an early deployment blueprint and does not include any hardcoded secrets.
