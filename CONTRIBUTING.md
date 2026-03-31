# Contributing to UniNotepad

This guide covers local dev setup, code style, and the PR process.

## Prerequisites

- Node.js 20.9 or later
- pnpm (install with `corepack enable && corepack prepare pnpm@latest --activate`)
- PostgreSQL 15 or later
- Git

## Local development setup

1. Fork and clone the repository:

   ```bash
   git clone https://github.com/your-username/uninotepad.git
   cd uninotepad
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env.local
   ```

   At minimum, fill in:
   - `DATABASE_URL` -- your PostgreSQL connection string
   - `AUTH_SECRET` -- generate with `npx auth secret`

   See [docs/configuration.md](docs/configuration.md) for all environment variables.

4. Set up the database:

   ```bash
   pnpm dlx prisma migrate dev
   ```

5. (Optional) Seed sample data:

   ```bash
   pnpm dlx prisma db seed
   ```

   This creates a demo admin account and sample data. See `prisma/seed.ts` for details.

6. Start the dev server:

   ```bash
   pnpm dev
   ```

7. Open http://localhost:3000 and complete the setup wizard.

## Subdomain routing in local dev

UniNotepad uses subdomains for role-based routing. Most browsers resolve `*.localhost` natively, so these work without any `/etc/hosts` changes:

- http://localhost:3000 -- public pages and student dashboard
- http://admin.localhost:3000 -- admin panel
- http://lecturer.localhost:3000 -- lecturer dashboard

If your browser doesn't resolve `*.localhost`, add these to `/etc/hosts`:

```
127.0.0.1 admin.localhost
127.0.0.1 lecturer.localhost
```

## Code style

- ESLint v9 with flat config (`eslint.config.mjs`) -- runs `eslint-config-next` with core web vitals and TypeScript rules
- TypeScript in strict mode
- Tailwind CSS v4 with `@theme` inline config in `globals.css`
- Zod 4 for all input validation (import from `zod/v4`)

Run the linter before committing:

```bash
pnpm lint
```

## Branch naming

Use descriptive prefixes:

- `feat/add-quiz-export` -- new features
- `fix/login-redirect-loop` -- bug fixes
- `docs/update-api-reference` -- documentation changes
- `refactor/simplify-auth-flow` -- code refactoring

## Submitting a pull request

1. Create a branch from `main`
2. Make your changes
3. Run `pnpm lint` and fix any issues
4. Push your branch and open a PR against `main`
5. Fill in the PR description: what changed, why, and how to test it

Keep PRs focused. One feature or fix per PR is easier to review than a large bundle of unrelated changes.

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when filing issues. Include steps to reproduce, expected vs actual behavior, and your environment details.

## Requesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md). Describe the problem you're trying to solve before jumping to a solution.

## Code review

All PRs need at least one approval before merging. Reviewers may request changes. Be respectful per our [code of conduct](CODE_OF_CONDUCT.md).
