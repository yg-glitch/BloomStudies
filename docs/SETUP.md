# Bloom Studies — Setup

Bloom Studies runs in two modes:

- **Demo mode (default):** no configuration required. Authentication is disabled
  and data lives in the browser. Useful for local development and previews.
- **Production mode:** add Supabase + AI credentials and every feature becomes
  real (accounts, persistence, AI responses).

## 1. Install & run

```bash
npm install
cp .env.example .env.local   # fill in values (all optional for demo mode)
npm run dev
```

App runs at http://localhost:3000.

## 2. AI provider (Gemini)

1. Create a free key at https://aistudio.google.com/app/apikey
2. Set `GEMINI_API_KEY` in `.env.local`.

Other providers (`OPENAI_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`,
`DEEPSEEK_API_KEY`) are optional and used as automatic failover.

## 3. Supabase (authentication + database)

1. Create a project at https://supabase.com/dashboard.
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; required
     only for account deletion)
3. Open the **SQL editor** and run [`supabase/schema.sql`](../supabase/schema.sql).
4. In **Authentication → URL Configuration**, set:
   - **Site URL:** your deployed URL (or `http://localhost:3000` for local)
   - **Redirect URLs:** add `<site-url>/auth/callback`

Once `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present,
the app automatically switches out of demo mode and enforces auth on
`/dashboard/*`.

### OAuth providers (Google / Apple / Microsoft)

Enable each under **Authentication → Providers** in Supabase and paste the
client ID/secret from the provider console. Use this callback URL in each
provider:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

- **Google:** https://console.cloud.google.com/apis/credentials
- **Apple:** https://developer.apple.com/account/resources/identifiers
- **Microsoft:** Azure AD app registration (Supabase provider is named "Azure")

### Phone OTP

Enable the **Phone** provider in Supabase and connect an SMS provider (Twilio,
MessageBird, Vonage, etc.) under the same screen.

## 4. Environment variables reference

See [`.env.example`](../.env.example) for the full annotated list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | for AI | Gemini API key (`GOOGLE_API_KEY` also accepted) |
| `NEXT_PUBLIC_SUPABASE_URL` | for auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for auth | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Server-only; enables account deletion |
| `NEXT_PUBLIC_SITE_URL` | prod | Base URL for auth redirects |
| `STRIPE_*` | optional | Premium subscriptions |
