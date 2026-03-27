# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js 16 Warning

This project uses **Next.js 16** which has breaking changes from previous versions. APIs, conventions, and file structure may differ from training data. **Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.** Heed deprecation notices. Key change: `proxy.ts` replaces `middleware.ts` for subdomain routing.

## Commands

```bash
pnpm dev        # Dev server at http://localhost:3000
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # ESLint (v9 flat config)
```

Package manager is **pnpm**. Node 20.9+ required.

## Project Overview

UniNotepad (LUNSL) is a university learning platform for developing countries. Students browse course materials (filtered by faculty/semester/program), use an AI study assistant with 10 learning tools, manage tasks, message peers/lecturers, and participate in forums. Lecturers upload content. Admins manage users, settings, and moderation.

Single-tenant standalone deployment via Docker. No vendor lock-in — every paid service has an open-source fallback.

## Architecture

- **Next.js 16 App Router** with subdomain-based routing via `proxy.ts`
  - Root domain: public pages + student dashboard
  - `admin.*`: admin panel
  - `lecturer.*`: lecturer dashboard
- **React 19**, **TypeScript 5**, **Tailwind CSS v4** (uses `@theme` inline config in globals.css)
- **shadcn/ui** components (copied into project, not an npm dep — use `pnpm dlx shadcn@latest add [component]`)
- **PostgreSQL** + **Prisma 6** ORM for data
- **NextAuth.js v5** with hybrid sessions: JWT for credentials, DB sessions for OAuth
- **TanStack Query v5** for client-side data fetching
- **Google Gemini API** for AI (Ollama as open-source fallback)
- **Cloudinary** for file storage (S3/MinIO as fallback)
- **Zod 4** for input validation on all API routes (import from `zod/v4`)

## App Structure

```
src/app/
├── (public)/       # Landing, login, register, setup wizard (route group)
├── (student)/      # Student dashboard and features (route group)
├── _admin/         # Admin panel (underscore prefix — rewrite target for admin.* subdomain)
├── _lecturer/      # Lecturer dashboard (underscore prefix — rewrite target for lecturer.*)
└── api/            # All API routes
src/
├── components/     # UI components (ui/ has shadcn, shared/ has custom)
├── lib/            # Auth config, AI clients, validators, utilities
├── hooks/          # Custom React hooks
└── types/          # TypeScript type extensions
prisma/
├── schema.prisma   # 24 models, 11 enums
└── migrations/
```

**Important**: `_admin/` and `_lecturer/` use underscore prefix (NOT parentheses) because proxy.ts rewrites `admin.*` → `/_admin/*`. Parenthesized route groups are invisible in URLs.

## Key Design Decisions

- **Role-based access control** on every API route with content isolation at DB level (Prisma where clauses)
- **Three roles**: Student, Lecturer, Admin — each gets a subdomain
- **AI token system**: Free tier (20 queries/day with 7-hour cooldown), paid tier (1 query = 1 token)
- **Passwords**: bcrypt with cost factor 12
- **Soft deletes** on User and Content (7-day grace period)
- **Rate limiting**: 5 login attempts/minute per IP

## Planning Documents

- `prd.md` — Full product requirements (features, data model, API routes, security)
- `implementation.md` — Phase-by-phase implementation plan with complete Prisma schema
