# UniNotepad

Open-source learning platform for universities in developing countries. Most students at African universities can't afford ChatGPT, and course materials live on random WhatsApp groups or don't exist digitally at all. UniNotepad puts everything in one place: course materials, an AI study assistant, task management, and messaging.

This started as LUSL Notepad at Limkokwing University Sierra Leone in early 2026. Students used it, we learned what worked, and rebuilt it from scratch so any university can run their own instance.

Aligned with UN Sustainable Development Goals:
- [SDG 4.3](https://sdgs.un.org/goals/goal4) -- equal access to affordable higher education
- [SDG 4.4](https://sdgs.un.org/goals/goal4) -- relevant skills for employment through AI study tools
- [SDG 4.a](https://sdgs.un.org/goals/goal4) -- effective learning environments replacing scattered WhatsApp groups

## Quick start

```bash
git clone https://github.com/your-org/uninotepad.git
cd uninotepad
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET at minimum
pnpm dlx prisma migrate dev
pnpm dev
```

Open http://localhost:3000 and complete the setup wizard to create an admin account and configure your university.

## Tech stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 | App Router, Server Components, `proxy.ts` for subdomain routing |
| Database | PostgreSQL + Prisma 6 | 25 models, 11 enums |
| Auth | NextAuth v5 | Email/password, Google OAuth, Facebook OAuth |
| UI | shadcn/ui + Tailwind CSS v4 | Components copied into project, `@theme` inline config |
| AI | Google Gemini | Configurable model (Flash/Pro), 10 learning tools |
| File storage | Cloudinary | PDFs, images, documents |
| Email | Resend | Transactional email (verification, password reset) |
| Payments | Monime + Stripe | Mobile money (Sierra Leone) and card payments |
| TTS | Web Speech API / ElevenLabs | Free browser TTS with optional premium fallback |

## Architecture

UniNotepad uses subdomain-based routing to separate user roles. A single Next.js app handles everything through `proxy.ts`:

| URL | Who | Internal route |
|-----|-----|---------------|
| `yourdomain.com` | Public + Students | `src/app/(public)/` and `src/app/(student)/` |
| `admin.yourdomain.com` | Administrators | `src/app/_admin/` |
| `lecturer.yourdomain.com` | Lecturers | `src/app/_lecturer/` |

For local development, `*.localhost` resolves natively in most browsers -- `admin.localhost:3000` and `lecturer.localhost:3000` work without `/etc/hosts` changes.

```
src/app/
├── (public)/       # Landing, login, register, setup wizard
├── (student)/      # Student dashboard and features
├── _admin/         # Admin panel (rewrite target for admin.*)
├── _lecturer/      # Lecturer dashboard (rewrite target for lecturer.*)
└── api/            # All API routes (~95 endpoints)
```

## Documentation

- [Configuration](docs/configuration.md) -- environment variables, AppSettings, provider setup
- [Self-hosting](docs/self-hosting.md) -- deploy on a VPS with Caddy
- [API reference](docs/api-reference.md) -- every endpoint documented
- [Contributing](CONTRIBUTING.md) -- local dev setup, code style, PR process

## License

MIT -- see [LICENSE](./LICENSE).
