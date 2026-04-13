# System Design Decisions

## Deployment Topology

- `apps/web` deploys to Vercel
- `apps/api` deploys to Render as the public REST API
- PostgreSQL deploys to Render PostgreSQL

The frontend will never connect directly to the database. All stateful operations go through the API.

## Auth Strategy

- Access token: short-lived JWT used for authenticated API requests
- Refresh token: long-lived opaque token stored and validated by the backend
- Passwords: hashed before storage

Planned direction:

- Access token returned to the frontend after login
- Refresh token stored as an `HttpOnly` cookie when possible
- Backend keeps a refresh-token table so sessions can be rotated and revoked

This fits the assignment requirement for JWT with refresh tokens while keeping revocation under backend control.

## API Boundary

The frontend is responsible for presentation and editor interactions. The backend is responsible for all trust-sensitive rules:

- document ownership checks
- share-token validation
- read-only enforcement on public share routes
- save conflict protection
- block ordering persistence
- `order_index` re-normalization

## Save Consistency Strategy

The assignment explicitly warns about stale writes. The safest high-level direction is:

- client sends a revision identifier or updated timestamp with each save
- server rejects stale writes or applies last-known-valid sequencing rules
- client aborts outdated in-flight saves when newer edits occur

We will choose the exact implementation in a later phase, but the architecture already reserves this responsibility for the backend and client together rather than trusting arrival order.

## Share-Link Model

- owner can generate a public read-only link
- public viewer can fetch shared document content
- public viewer cannot mutate blocks or documents
- share access is enforced at API level, not just UI level

## Block Model Direction

Each block will carry:

- document relation
- block type
- JSON content
- `order_index`
- optional `parent_id`

Even though the first version is mostly flat, keeping `parent_id` from the start gives us compatibility with the assignment schema and room for future nesting-related decisions.

## Core Risks Identified Early

- contenteditable cursor management during split and merge operations
- slash command filtering without polluting stored block content
- repeated midpoint inserts shrinking `order_index` gaps
- stale save responses arriving out of order
- accidental cross-account access if document ownership checks are missed

These will be treated as architecture-level constraints, not late QA issues.
