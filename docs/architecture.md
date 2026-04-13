# Architecture Plan

## High-Level Shape

The application will be split into two deployable apps inside one repository:

- `apps/web`: Next.js application deployed to Vercel
- `apps/api`: Express.js API deployed to Render

Render PostgreSQL will be used as the production database. Prisma will live in the backend app because all database access should go through the REST API.

## Why This Shape Fits The Assignment

- The assignment explicitly requires a REST API backend
- The editor contains non-trivial input logic that is easier to keep isolated in the frontend
- Auth, ownership checks, share-token protection, and stale-write protection belong in the backend
- Vercel is a natural fit for Next.js, while Render is a practical free option for Express and PostgreSQL

## Responsibility Split

### Frontend

- Register and login flows
- Dashboard for documents
- Block editor UI and interactions
- Auto-save UX states
- Public share page in read-only mode

### Backend

- JWT auth and refresh token flow
- User, document, block, and share-token APIs
- Ownership enforcement
- Read-only enforcement for share links
- Save ordering and stale-write protection
- Block ordering and re-normalization

## Proposed Route Groups

### Frontend routes

- `/login`
- `/register`
- `/dashboard`
- `/documents/[id]`
- `/share/[token]`

### Backend route groups

- `/auth`
- `/documents`
- `/blocks`
- `/share`

## Data Ownership Principle

The frontend never directly accesses the database. All reads and writes pass through the Express API so the same authorization and validation rules apply to normal users and public share viewers.

## Planned Next Steps

1. Scaffold the two apps and shared tooling
2. Define the Prisma schema for users, documents, blocks, and refresh tokens
3. Add local development and deployment environment configuration
