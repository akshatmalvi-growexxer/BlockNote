## 2026-04-13

**Tool:** ChatGPT (Codex)

**What I asked for:**
Architecture setup, project scaffolding, Prisma schema and data model decisions, auth backend (JWT + refresh), frontend auth flow, dashboard shell (list/create/rename/delete documents).

**What it generated:**
Monorepo scaffold, deployment/config docs, Prisma schema and data model notes, Express auth routes (register/login/refresh/logout), frontend login/register/dashboard pages, and document CRUD API + UI for the dashboard.

**What was wrong or missing:**
Nothing critical in this phase. Some pieces (editor behavior, order_index renormalization logic, cross-account access tests, and edge-case handling) are not implemented yet because they belong to later phases.

**What I changed and why:**
No major manual rewrites. I will add required entries later once editor logic (enter split, order_index behavior, and cross-account access protection) are implemented and validated.

## 2026-04-14

**Tool:** ChatGPT (Codex)

**What I asked for:**
Implement the first major editor layer: block CRUD API, ordered document fetch, initial editor rendering, block selection/focus behavior, and base content handling for paragraph, heading, todo, code, divider, and image blocks.

**What it generated:**
Block CRUD routes with ordered fetch and midpoint ordering, initial editor rendering for all block types, focus and selection handling in the editor, dashboard/editor bootstrap fixes, and base content shapes for each supported block type.

**What was wrong or missing:**
The first pass had rough edges in editing behavior. Typing issues, bootstrap quirks, and some block interactions still needed refinement before the editor felt reliable.

**What I changed and why:**
I refined the generated editor foundation so the document page became usable as a real starting point. The goal was to stabilize block rendering and give later interaction/persistence features a clean base.

## 2026-04-15

**Tool:** ChatGPT (Codex)

**What I asked for:**
Implement editor interaction behavior: Enter and Backspace rules, slash menu command flow, code block tab behavior, drag-and-drop ordering, todo improvements, and auto-save with save indicators and stale-write protection.

**What it generated:**
Keyboard interaction logic for block splitting and deletion, slash menu behavior with filtered commands, code block tab insertion, drag reorder with immediate persistence, todo flow improvements, and debounced auto-save with save-state feedback and stale response protection.

**What was wrong or missing:**
Some of the generated interaction logic needed follow-up adjustments after testing. Enter behavior, slash cleanup, focus movement, and ordering behavior had edge cases that were not fully correct on the first try.

**What I changed and why:**
I tested the editor interactions in the browser and tightened the behavior where needed so typing, splitting, reordering, and saving felt dependable rather than fragile.

## 2026-04-16

**Tool:** ChatGPT (Codex)

**What I asked for:**
Implement sharing, security, and correctness hardening: public read-only share links, share disable flow, ownership protection tests, order_index precision checks, renormalization tests, save-ordering tests, and required edge-case handling.

**What it generated:**
Public sharing endpoints and read-only share page behavior, share enable/disable support, ownership/security test scripts, order_index correctness tests, renormalization checks, save-ordering validation, and fixes for editor edge cases such as divider/image adjacency and split behavior.

**What was wrong or missing:**
The generated security and correctness work covered the main requirements, but some editor edge cases still surfaced only after manual testing. Divider behavior and a few interaction paths needed additional cleanup.

**What I changed and why:**
I kept the generated protection and test structure, then used manual verification to patch edge cases that could have made the app unreliable in real use.

## 2026-04-17

**Tool:** ChatGPT (Codex)

**What I asked for:**
Polish the product experience and deployment readiness: FluxNotes rebrand, loading/error UX, improved dashboard/share UI, deployment scripts for Render, Next.js build fixes, theme toggle, image block UX, hover-only block controls, and final editor interface cleanup.

**What it generated:**
FluxNotes branding updates, loading and error states, dashboard/share UI improvements, deployment-oriented Prisma/Render scripts, a build fix for the login flow, theme toggle support, image block edit/render behavior with invalid URL recovery, and final UX refinements including hover-based block actions.

**What was wrong or missing:**
Polish work needed a few extra iterations after generation. Dark mode tone, block action visibility, image block behavior, and some shared-document presentation details had to be refined after checking the result in the UI.

**What I changed and why:**
I adjusted the generated UI and deployment changes until the app felt more coherent and presentation-ready, not just technically functional. This final pass was about making the project look and behave like a complete product.
