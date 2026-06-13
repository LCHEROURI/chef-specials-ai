# Prompt Vault Pro

Prompt Vault Pro is a private prompt knowledge library built with React,
TypeScript, Vite, and Supabase. The MVP supports authentication, prompt
creation and versioning, search and filters, folders and tags, templates,
imports, exports, attachments, analytics, themes, and Free/Pro entitlements.

## Local Setup

Requirements:

- Node.js 20 or newer
- Docker Desktop for local Supabase
- Supabase CLI, installed as a project dependency

Install and start the frontend:

```bash
npm install
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers npx playwright install chromium
cp .env.example .env.local
npm run dev
```

Set these browser-safe variables in `.env.local`:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never add a Supabase service-role key to this Vite application.

## Supabase

Start and reset the local database:

```bash
npx supabase start
npx supabase db reset
```

The reset applies migrations, creates the private `prompt-files` bucket, and
loads the deterministic system templates from `supabase/seed.sql`.

Authentication configuration:

- Enable email/password authentication.
- Enable Google OAuth when needed.
- Add `http://localhost:5173` to the allowed redirect URLs for local work.
- Add the production Vercel URL before release.

## Starter Content

The seed includes the nine product starter templates plus:

- **Master Prompt Template**, transcribed from `Master Prompt Template.pdf`
- **Power Prompt Builder**, an expanded implementation-ready framework based
  on the recent Power prompt concept

Stable UUIDs and `on conflict` updates make database resets idempotent.

## Verification

```bash
npm run lint
npm test -- --run
npm run build
npm run test:e2e
```

The authenticated lifecycle and Supabase Row Level Security checks require a
running local Supabase instance and test users. The public browser suite checks
the desktop and mobile authentication shell without external credentials.

## Deployment

Vercel settings:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`

`vercel.json` contains the SPA rewrite needed for direct route navigation.

## Deferred Roadmap

Stripe billing, team sharing, public libraries, marketplace features, workflow
execution, prompt A/B testing, AI scoring, and autonomous agents are outside
the MVP.
