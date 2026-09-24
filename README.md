# UniNotepad

An open-source learning platform for universities, built for institutions in
developing countries where bandwidth is scarce and licensing budgets are
smaller than the problem.

Students browse course materials scoped to their faculty and semester, study
with an AI assistant, manage tasks and schedules, message classmates and
lecturers, and take part in module forums. Lecturers publish materials to their
faculty. Administrators manage users, academic structure, moderation, and
system settings.

Single-tenant, self-hostable, and free of vendor lock-in — every paid service
has an open-source fallback.

**Licence:** MIT · **Status:** pre-1.0. See [`docs/SYSTEM_AUDIT.md`](docs/SYSTEM_AUDIT.md)
for the current known-issues list and what is not yet implemented.

---

## Table of contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
  - [Neon PostgreSQL](#neon-postgresql)
  - [Cloudinary](#cloudinary)
  - [Google Gemini](#google-gemini)
  - [Resend](#resend)
- [Database and migrations](#database-and-migrations)
- [First-run installation](#first-run-installation)
- [Subdomain routing](#subdomain-routing)
- [The role system](#the-role-system)
- [Architecture](#architecture)
- [Testing](#testing)
- [Contributing](#contributing)

---

## Stack

| Concern | Choice | Open-source fallback |
|---|---|---|
| Framework | Next.js 16 (App Router) | — |
| Language | TypeScript 5 (strict) | — |
| UI | React 19, Tailwind CSS v4, shadcn/ui | — |
| Database | PostgreSQL 14+ via Prisma 6 | Any Postgres; Neon is not required |
| Auth | NextAuth v5 (JWT sessions) | — |
| Data fetching | TanStack Query v5 | — |
| Validation | Zod 4 | — |
| AI | Google Gemini | Ollama |
| File storage | Cloudinary | S3 / MinIO |
| Email | Resend | Any SMTP provider |
| Tests | Vitest + Playwright | — |

Package manager is **pnpm**. Node **20.9+** is required.

> **Next.js 16 note.** This project targets Next.js 16, which has breaking
> changes from earlier versions — most visibly `proxy.ts` in place of
> `middleware.ts`, and `params` being a `Promise` in dynamic routes. Consult
> `node_modules/next/dist/docs/` before writing routing code.

---

## Quick start

```bash
git clone https://github.com/Alhassanojoekoroma/UNI-Notpad-V1.0.git
```

```bash
cd UNI-Notpad-V1.0 && pnpm install
```

```bash
cp .env.example .env
```

Fill in `.env` (see [Configuration](#configuration)), then:

```bash
npx prisma migrate deploy && npx prisma generate
```

```bash
pnpm dev
```

The app is served at http://localhost:3000. Go to `/setup` to run the
installation wizard — see [First-run installation](#first-run-installation).

### Everyday commands

```bash
pnpm dev
```

```bash
pnpm build
```

```bash
pnpm lint
```

```bash
pnpm test
```

---

## Configuration

Every variable lives in `.env`, documented inline in
[`.env.example`](.env.example). Nothing in that file is a real credential.

Two rules worth stating plainly:

1. **Never prefix a secret with `NEXT_PUBLIC_`.** That prefix inlines the value
   into the JavaScript bundle shipped to every browser. `CLOUDINARY_API_SECRET`,
   `AUTH_SECRET`, `GEMINI_API_KEY` and `DATABASE_URL` are server-only.
2. **Environment variables win over the database.** Several third-party keys can
   also be stored in `AppSettings` through the admin panel, but the environment
   is checked first — so you can keep secrets out of Postgres entirely, which is
   the recommended setup.

Generate the auth secret with:

```bash
npx auth secret
```

### Neon PostgreSQL

Any PostgreSQL 14+ database works. [Neon](https://neon.tech) is convenient
because its free tier is generous and it speaks plain Postgres.

1. Create a project at neon.tech.
2. Copy the **pooled** connection string from the dashboard.
3. Set it as `DATABASE_URL`, keeping `?sslmode=require`.

```
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/uninotepad?sslmode=require"
```

Neon caps concurrent connections. In development the Prisma client is cached on
`globalThis` so hot reloads reuse one pool — if you add another `PrismaClient`
anywhere, you will exhaust that cap quickly.

### Cloudinary

Used for uploaded course materials (PDF, PPTX, DOCX, JPEG, PNG; 50 MB max).

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy **Cloud name**, **API Key** and **API Secret**.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

All uploads are proxied through the server (`/api/lecturer/content`), which
verifies the file's magic bytes before forwarding. Credentials never reach the
browser.

To swap in S3 or MinIO, replace `src/lib/cloudinary.ts` — it is the only module
that touches the Cloudinary SDK.

### Google Gemini

1. Create an API key at [aistudio.google.com](https://aistudio.google.com/apikey).
2. Set `GEMINI_API_KEY`.

The model is configurable in Admin → Settings (default `gemini-2.0-flash`).
To run locally with Ollama instead, replace `getGeminiClient()` in
`src/lib/gemini.ts`.

### Resend

Required for password-reset delivery. Without it, resets are logged as a
server-side error and no email is sent — users will never receive a reset link.

1. Create an account at [resend.com](https://resend.com) and verify a domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM`.

---

## Database and migrations

```bash
npx prisma migrate deploy
```

Applies all committed migrations. Use this in production and CI.

```bash
npx prisma migrate dev --name describe_your_change
```

Creates a new migration from your `schema.prisma` edits and applies it. Use this
in development only.

```bash
npx prisma generate
```

Regenerates the typed client. Required after any schema change.

```bash
npx prisma studio
```

Opens a browser UI for inspecting data.

```bash
ALLOW_DEMO_SEED=true DEMO_ADMIN_PASSWORD='choose-a-long-local-password' pnpm exec tsx prisma/seed.ts
```

Seeds settings and a local demo administrator. `SEED_MODE=full` adds sample
content and users and also requires `DEMO_LECTURER_PASSWORD` and
`DEMO_STUDENT_PASSWORD`. The seed refuses to run in production, requires an
explicit opt-in, and never prints passwords. Use the PowerShell equivalent
(`$env:NAME='value'`) on Windows.

> **Before running a migration against real data,** read the generated SQL in
> `prisma/migrations/`. Prisma will happily generate a destructive migration if
> the schema change implies one.

---

## First-run installation

Creating the first administrator and writing the system's API keys is the most
privileged operation in the application, so it is gated twice.

1. Set `SETUP_TOKEN` in the server environment:

   ```bash
   openssl rand -hex 32
   ```

2. Start the app and visit `/setup`.
3. Complete the wizard. On the final step, paste the `SETUP_TOKEN` value.
4. Remove or rotate `SETUP_TOKEN` once installation is complete.

Without `SETUP_TOKEN` the wizard refuses to run (`503`), so a freshly deployed
instance cannot be claimed by whoever finds the URL first.

After setup, `/setup` becomes the student profile-completion page used after
OAuth sign-up.

---

## Subdomain routing

`src/proxy.ts` maps subdomains onto route segments:

| Host | Serves | Route segment |
|---|---|---|
| `example.org` | Auth, legal pages, student app | `(auth)`, `(public)`, `(student)` |
| `admin.example.org` | Admin panel | `app/admin/*` |
| `lecturer.example.org` | Lecturer dashboard | `app/lecturer/*` |

Set `NEXT_PUBLIC_ROOT_DOMAIN` to your apex domain. Locally, browsers resolve
`*.localhost` automatically — use `admin.localhost:3000` and
`lecturer.localhost:3000` with no hosts-file changes.

The proxy also blocks `/admin` and `/lecturer` on the root domain, so those
areas are reachable only through their subdomains.

**When writing links, omit the role prefix.** The browser URL on
`admin.example.org` is `/users`, not `/admin/users` — the rewrite is invisible
to the client. Linking to `/admin/users` from the admin subdomain would rewrite
to `/admin/admin/users` and 404.

---

## The role system

Three roles, defined by the `UserRole` enum. **A role is never chosen by the
person signing up.**

### Student

Created by public registration at `/register`. `POST /api/auth/register` always
writes `role: "STUDENT"` and ignores any `role` in the request body.

A student picks their faculty, program and semester at registration. Those three
values are the isolation keys for content, forum and search: a student sees only
active materials in their own faculty *and* semester.

### Lecturer

**Cannot self-register.** An administrator issues a single-use access code from
Admin → Codes, and the lecturer redeems it at `/register/lecturer`.

The code determines the lecturer's faculty — they never choose it. This matters
because faculty membership is what authorises publishing and forum moderation.
A code is claimed inside the same transaction that creates the account and can
never mint a second one.

Lecturers may publish materials to their assigned faculty, view analytics for
their own uploads, moderate forum threads in their faculty, and message students.

### Admin

Created only by the installation wizard, or by an existing admin promoting a
user. There is no public path to this role.

Admins manage users and roles, faculties, programs, lecturer codes, content
flags, user reports, bulk messaging and system settings.

### Enforcement

Authorisation is enforced **server-side, on every route**, through
`src/lib/rbac.ts`:

```ts
const guard = await requireRole("ADMIN");
if (!guard.ok) return guard.response;
// guard.user is typed, non-null and role-checked
```

`401` means "not signed in"; `403` means "signed in, not permitted".

Hiding a navigation item is presentation, never security. Editing client-side
JavaScript, replaying a request, or calling an endpoint directly all still hit
the same server-side check.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx         Session-aware product entry redirect
│   ├── (auth)/           Login, register, password reset, setup wizard
│   ├── (public)/         Privacy, terms, code of conduct
│   ├── (student)/        Student app (auth-gated in layout.tsx)
│   ├── admin/            Admin panel — target of the admin.* rewrite
│   ├── lecturer/         Lecturer dashboard — target of the lecturer.* rewrite
│   └── api/              Route handlers
├── components/
│   ├── ui/               shadcn/ui primitives (copied in, not a dependency)
│   ├── layouts/          App shell, sidebars, navigation
│   └── …                 Feature components by domain
├── lib/
│   ├── rbac.ts           Role guards and content scoping — start here
│   ├── auth.ts           NextAuth configuration
│   ├── rate-limit.ts     Fixed-window limiter
│   ├── prisma.ts         Client singleton + soft-delete extension
│   └── validators/       Zod schemas, one per domain
└── proxy.ts              Subdomain routing (replaces middleware.ts)
prisma/
├── schema.prisma         24 models, 11 enums
└── migrations/
```

Design decisions worth knowing before you change anything:

- **Content isolation is a database-level `where` clause**, not a UI filter. See
  `contentScopeFilter` in `src/lib/rbac.ts`.
- **Soft deletes** on `User` and `Content` with a 7-day grace period. The Prisma
  client extension in `src/lib/prisma.ts` filters deleted users out of every
  read path automatically.
- **Passwords** are bcrypt, cost factor 12.
- **AI budget**: 20 free queries per day with a 7-hour cooldown, then 1 token per
  query. Token *purchase* is not implemented — see `docs/SYSTEM_AUDIT.md`.
- **Adding a nav item?** Add the page too. `tests/unit/lib/navigation.test.ts`
  asserts every nav `href` resolves to a real file.

---

## Testing

```bash
pnpm test
```

Runs unit tests (Vitest, jsdom). Integration tests are included automatically
when `DATABASE_URL_TEST` is set.

```bash
pnpm test:watch
```

```bash
pnpm test:coverage
```

```bash
pnpm test:e2e
```

Playwright end-to-end tests. Requires a running dev server and a seeded
database.

> **`DATABASE_URL_TEST` must point at a throwaway database.** The integration
> suite truncates tables between runs.

Before opening a pull request, all four of these should pass:

```bash
npx tsc --noEmit && npx eslint src && npx vitest run && npx next build
```

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

Two house rules that save review time:

- **Never fix a type or lint error by hiding it.** `@ts-ignore`, `any`, empty
  catch blocks, and disabled lint rules will be sent back. Fix the cause.
- **Authorisation belongs on the server.** A pull request that hides a control
  in the UI without a matching server-side check is not a fix.

---

## Further reading

| Document | Contents |
|---|---|
| [`docs/SYSTEM_AUDIT.md`](docs/SYSTEM_AUDIT.md) | Current system and verification audit |
| [`docs/BUG_AUDIT.md`](docs/BUG_AUDIT.md) | Security/correctness findings and dispositions |
| [`docs/UX_AUDIT.md`](docs/UX_AUDIT.md) | Student, lecturer, and administrator journeys |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Runtime, data, and authorization architecture |
| [`docs/REPAIR_CHANGELOG.md`](docs/REPAIR_CHANGELOG.md) | Implemented repair record |
| [`docs/self-hosting.md`](docs/self-hosting.md) | Docker deployment |
| [`docs/configuration.md`](docs/configuration.md) | Settings reference |
| [`docs/api-reference.md`](docs/api-reference.md) | Endpoint reference |
| [`prd.md`](prd.md) | Original product requirements |
| [`implementation.md`](implementation.md) | Phase-by-phase implementation plan |
