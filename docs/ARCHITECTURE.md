# Shad-SaaS — Phase 0.1 Architecture & Spec

## Goal
Establish a basic Monorepo structure with:
1. pnpm workspaces configuration
2. `apps/api` (Hono + TypeScript) — hello world server
3. `packages/db` (Drizzle) — basic Schema with tenants and users tables
4. `packages/shared-types` — shared TypeScript types
5. `packages/utils` — common helper functions

## Requirements Matrix

### 1. Root Files
- `package.json` (workspaces: `apps/*`, `packages/*`)
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `.gitignore` (`node_modules`, `dist`, `.env`, `.tmp`, `drizzle/meta`)
- `.npmrc` (`shamefully-hoist=false`, `strict-peer-dependencies=false`)
- `.env.example`
- `README.md`
- `docs/ARCHITECTURE.md`

### 2. apps/api
- package name: `@shad-saas/api`
- tsconfig.json
- `src/index.ts` — starts Hono server on port 3000 using `@hono/node-server`
- `src/app.ts` — imports routes
- `src/routes/index.ts`:
  - `GET /api/health` → `{ status: "ok", message: "Shad-SaaS API is running" }`
  - `GET /api/version` → `{ version: "0.0.1-alpha" }`

### 3. packages/db
- package name: `@shad-saas/db`
- tsconfig.json
- `drizzle.config.ts` (uses `DATABASE_URL` from env)
- `src/index.ts` — exports Drizzle client & schema
- `src/client.ts` — creates Drizzle client
- `src/schema/index.ts` — exports all tables
- `src/schema/tenants.ts`:
    id (uuid pk), subdomain (text unique), display_name (text),
    plan (text), status (text default 'active'), created_at (timestamp)
- `src/schema/users.ts`:
    id (uuid pk), tenant_id (uuid), username (text unique),
    email (text unique), password_hash (text),
    balance_usd (numeric 14,2 default 0),
    banned (boolean default false), created_at (timestamp)

### 4. packages/shared-types
- package name: `@shad-saas/shared-types`
- tsconfig.json
- `src/index.ts` — exports `ApiResponse`, `Tenant`, `User`

### 5. packages/utils
- package name: `@shad-saas/utils`
- tsconfig.json
- `src/index.ts` — exports `cn()`, `formatCurrency()`, `generateUuid()`
