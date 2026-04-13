# Data Model Decisions

## Prisma Ownership

Prisma lives under `apps/api` because the backend is the only layer allowed to access PostgreSQL directly.

## Core Models

### User

- `id`
- `email`
- `password_hash`
- `created_at`

### Document

- `id`
- `user_id`
- `title`
- `share_token`
- `is_public`
- `revision`
- `created_at`
- `updated_at`

`revision` is included to support later stale-write protection for auto-save.

### Block

- `id`
- `document_id`
- `type`
- `content`
- `order_index`
- `parent_id`
- `created_at`
- `updated_at`

### RefreshToken

This is an additional backend session model to support JWT refresh-token rotation and revocation safely.

## Block Content JSON Shape

The `content` field is JSON for every block type, but each type follows a strict shape.

### paragraph

```json
{ "text": "" }
```

### heading_1

```json
{ "text": "" }
```

### heading_2

```json
{ "text": "" }
```

### todo

```json
{ "text": "", "checked": false }
```

### code

```json
{ "text": "" }
```

### divider

```json
{}
```

### image

```json
{ "url": "", "alt": "" }
```

`alt` is optional from a UX point of view, but keeping the key in the shape gives us a clean place for accessibility text.

## order_index Strategy

`order_index` will be stored as Prisma `Float`, matching your chosen direction and the assignment requirement that it must not be an integer.

Rules:

- first block can start at `1000`
- append operations can increment by `1000`
- insert-between uses the midpoint between neighboring block indexes
- drag reorder persists the new `order_index` immediately

## Re-normalization Strategy

The assignment requires re-normalization when the gap becomes too small.

Chosen rule:

- if the gap between two adjacent blocks drops below `0.001`, renormalize the document
- renormalization rewrites all block indexes in order to `1000, 2000, 3000...`
- this runs inside the backend so the source of truth stays consistent

This keeps midpoint math simple and reduces the chance of repeated float compression causing unstable ordering.

## Ownership Constraints

Ownership is enforced primarily by the relation `documents.user_id -> users.id`, plus API checks on every document-scoped route.

Important schema implications:

- every document belongs to exactly one user
- every block belongs to exactly one document
- deleting a user cascades to documents
- deleting a document cascades to blocks

This supports the assignment requirement that cross-account access to another user's document must return `403`.

## Indexes

Indexes chosen for later feature work:

- `documents(user_id, updated_at)` for dashboard listing by owner
- `documents(user_id, created_at)` for stable owner-scoped retrievals
- `documents(share_token)` via unique constraint for public share lookup
- `blocks(document_id, order_index)` for ordered block fetches
- `blocks(document_id, parent_id, order_index)` for parent-aware ordered fetches
- `refresh_tokens(user_id, expires_at)` and `refresh_tokens(user_id, revoked_at)` for token cleanup and validation
