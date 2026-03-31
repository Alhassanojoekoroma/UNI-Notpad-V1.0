# Configuration

UniNotepad is configured through environment variables (set in `.env.local`) and database-level AppSettings (managed through the admin panel or setup wizard).

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values you need.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/uninotepad` |
| `AUTH_SECRET` | Encrypts session tokens. Generate with `npx auth secret` | A random 32+ character string |
| `NEXTAUTH_URL` | Base URL of the application | `http://localhost:3000` or `https://yourdomain.com` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain used by `proxy.ts` for subdomain routing | `localhost:3000` or `yourdomain.com` |

### OAuth providers (optional)

Google and Facebook login are optional. If you don't set these, users can still register with email and password.

| Variable | Description | Where to get it |
|----------|-------------|----------------|
| `AUTH_GOOGLE_ID` | Google OAuth client ID | [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Same as above |
| `AUTH_FACEBOOK_ID` | Facebook app ID | [Meta Developer Portal](https://developers.facebook.com/) > My Apps |
| `AUTH_FACEBOOK_SECRET` | Facebook app secret | Same as above |

For Google OAuth, add these authorized redirect URIs:
- `http://localhost:3000/api/auth/callback/google` (development)
- `https://yourdomain.com/api/auth/callback/google` (production)

For Facebook OAuth, add these valid OAuth redirect URIs:
- `http://localhost:3000/api/auth/callback/facebook` (development)
- `https://yourdomain.com/api/auth/callback/facebook` (production)

### AI

| Variable | Description | Where to get it |
|----------|-------------|----------------|
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://aistudio.google.com/apikey) |

The free tier works fine for development. The specific Gemini model (Flash, Pro, etc.) is configured in AppSettings, not here.

### File storage

| Variable | Description | Where to get it |
|----------|-------------|----------------|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | [Cloudinary Console](https://console.cloudinary.com/) > Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Same as above |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Same as above |

Cloudinary handles all file uploads (PDFs, images, documents). Free tier: 25GB storage, 25GB bandwidth/month.

### Email

| Variable | Description | Where to get it |
|----------|-------------|----------------|
| `RESEND_API_KEY` | Resend API key for transactional email | [Resend Dashboard](https://resend.com/) > API Keys |

Used for email verification, password resets, and notifications. Without this, email-dependent features won't work.

### Text-to-speech (optional)

| Variable | Description | Where to get it |
|----------|-------------|----------------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key for premium TTS | [ElevenLabs](https://elevenlabs.io/) > Profile > API Keys |

Optional. The AI study assistant's audio overview feature falls back to the browser's built-in Web Speech API when this isn't set.

### Payments (optional)

| Variable | Description | Where to get it |
|----------|-------------|----------------|
| `MONIME_API_KEY` | Monime mobile money API key | [Monime Dashboard](https://monime.com/) |
| `STRIPE_SECRET_KEY` | Stripe secret key | [Stripe Dashboard](https://dashboard.stripe.com/) > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard > Developers > Webhooks |

Monime handles mobile money payments in Sierra Leone. Stripe handles card payments internationally. Both are optional -- without them, the token purchase feature is disabled and students rely on the free daily AI query allocation.

For Stripe webhooks, point the endpoint to `https://yourdomain.com/api/webhooks/stripe`.

---

## AppSettings (database)

These settings are configured through the admin panel at `admin.yourdomain.com/settings` or during the initial setup wizard at `/setup`. They're stored in the `AppSettings` table with a single row (id: `"default"`).

### University branding

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `universityName` | String | `"University"` | Displayed in the header and public pages |
| `universityLogo` | String? | `null` | URL to the university logo (uploaded to Cloudinary) |
| `primaryColor` | String | `"#7c3aed"` | Brand color used throughout the UI |
| `secondaryColor` | String | `"#1e1e1e"` | Secondary brand color |
| `domain` | String? | `null` | The production domain (e.g., `lunsl.org`) |

### Academic structure

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `studentIdPattern` | String | `"^90500\\d{4,}$"` | Regex pattern to validate student IDs during registration |
| `maxSemesters` | Int | `8` | Maximum number of semesters in the academic program |

### AI configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `geminiModel` | String | `"gemini-2.0-flash"` | Which Gemini model to use (e.g., `gemini-2.0-flash`, `gemini-1.5-pro`) |
| `geminiApiKey` | String? | `null` | Can override the env var. Stored in DB so admin can change without redeploying. |
| `freeQueriesPerDay` | Int | `20` | Number of free AI queries each student gets per day |
| `freeSuspensionHours` | Int | `7` | Cooldown period (hours) after free queries are exhausted |

### Token economy

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `referralBonusTokens` | Int | `5` | Tokens awarded when a referred user completes registration |
| `tokenPackages` | Json? | `null` | Array of purchasable token packages, e.g., `[{"amount": 10, "priceSLE": 50, "priceUSD": 2}]` |

### Service keys (optional overrides)

These can override the corresponding environment variables. Useful if the admin wants to change keys without redeploying.

| Field | Type | Description |
|-------|------|-------------|
| `elevenlabsApiKey` | String? | ElevenLabs TTS key |
| `resendApiKey` | String? | Resend email key |
| `monimeApiKey` | String? | Monime payment key |
| `stripeSecretKey` | String? | Stripe payment key |
| `cloudinaryCloudName` | String? | Cloudinary cloud name |
| `cloudinaryApiKey` | String? | Cloudinary API key |
| `cloudinaryApiSecret` | String? | Cloudinary API secret |

### Policy text

| Field | Type | Description |
|-------|------|-------------|
| `termsOfService` | Text? | Terms of service displayed on the `/terms` page |
| `privacyPolicy` | Text? | Privacy policy displayed on the `/privacy` page |
| `codeOfConduct` | Text? | Code of conduct displayed on the `/conduct` page |
| `contentPolicy` | Text? | Content upload guidelines shown to lecturers |
