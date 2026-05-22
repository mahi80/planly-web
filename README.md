# planly-web

Customer-facing Next.js app for **PD Intel** — UK planning intelligence SaaS.

Consumes the JSON API from [mahi80/planly](https://github.com/mahi80/planly). Built as a scaffold the customer-app team can extend; see [Roadmap](#roadmap) below for what's intentionally not built yet.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 + [shadcn/ui](https://ui.shadcn.com) (New York / Slate / CSS variables) |
| State / data | [TanStack Query](https://tanstack.com/query) v5 — caches API responses, handles pagination |
| API client | [openapi-fetch](https://github.com/openapi-ts/openapi-typescript) — type-safe, auto-generated from the backend's OpenAPI spec |
| Auth | [NextAuth.js v5 (Auth.js)](https://authjs.dev) — Credentials provider hitting `POST /auth/login`. Swap for Cognito when AWS P4 lands. |
| Forms | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Icons | [Lucide React](https://lucide.dev) |
| Drag/drop (Leads kanban) | [@dnd-kit](https://dndkit.com) |
| Deploy | Vercel (preview on PR, prod on `main`). AWS Fargate alternative — see `Dockerfile` when it lands in Session 4. |

## Local dev — 3 commands

```bash
# 1. Install deps (one-time)
npm install

# 2. Configure env (one-time)
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to your local FastAPI

# 3. Run
npm run dev   # http://localhost:3000
```

You also need the **backend** running locally on `:8000`:

```bash
# From the planly repo
cd /path/to/planly
JWT_SECRET=$(openssl rand -hex 32) uv run uvicorn api.main:app --port 8000
```

Seed an admin user via `scripts/seed_admin_user.py` (see planly's README).

## Regenerating API types

The TypeScript types in `lib/api/types.ts` come from the backend's live OpenAPI spec. Regenerate after any backend API change:

```bash
# In one terminal — start the backend
cd /path/to/planly
uv run uvicorn api.main:app --port 8000

# In another terminal — regenerate types
cd /path/to/planly-web
npm run gen:api
```

This pulls `http://localhost:8000/openapi.json` and rewrites `lib/api/types.ts`. Commit the result.

## Project layout

```
planly-web/
├── auth.ts                              NextAuth config (single source of truth for auth)
├── middleware.ts                        Route protection
├── app/
│   ├── layout.tsx                       Root layout — fonts, providers
│   ├── page.tsx                         Landing — redirects by auth state
│   ├── providers.tsx                    TanStack Query + Toaster + SessionProvider
│   ├── login/page.tsx                   Sign-in form
│   ├── api/auth/[...nextauth]/route.ts  Auth.js route handler
│   └── (authed)/                        Route group — all pages here require auth
│       ├── layout.tsx                   TopNav + main container
│       ├── _components/TopNav.tsx       Navigation
│       ├── search/page.tsx              (Session 2 expands this)
│       ├── applications/[id]/page.tsx   (Session 2)
│       ├── saved-searches/page.tsx      (Session 3)
│       ├── letters/page.tsx             (Session 3)
│       ├── leads/page.tsx               (Session 4)
│       ├── admin/page.tsx               (Session 4 — platform_admin only)
│       └── account/page.tsx             (Session 4)
├── lib/
│   ├── api/
│   │   ├── client.ts                    openapi-fetch wrapper (with + without auth)
│   │   └── types.ts                     GENERATED from /openapi.json — do not hand-edit
│   ├── queries.ts                       (Session 2 — TanStack Query hooks)
│   └── utils.ts                         shadcn's cn() helper
├── components/
│   ├── ui/                              shadcn/ui components (button, card, form, …)
│   ├── search/                          (Session 2)
│   ├── letters/                         (Session 3)
│   └── leads/                           (Session 4)
└── e2e/                                 (Session 4 — Playwright smoke test)
```

## How to add a new page

1. Drop a server component in `app/(authed)/<route>/page.tsx`
2. For data fetching:
   - **Server side**: `import { auth } from "@/auth"` and use `createAuthedApiClient(session.accessToken)` directly
   - **Client side**: add a hook to `lib/queries.ts` using `useQuery` from TanStack Query
3. For forms: use React Hook Form + Zod (copy the `app/login/page.tsx` pattern)
4. For nav exposure: add to `_components/TopNav.tsx` `PRIMARY_LINKS`

## Deploy

### Vercel (recommended for dev/preview)

1. Push to `main`
2. Vercel dashboard → New Project → Import from GitHub → select `mahi80/planly-web`
3. Environment variables: paste `.env.local` values into Vercel project settings
4. Vercel auto-deploys on push to `main` and previews on PR

For Vercel to call our backend, the FastAPI must be publicly reachable. Two options:

- **Quick demo**: use [ngrok](https://ngrok.com) — `ngrok http 8000` and set `NEXT_PUBLIC_API_URL` to the ngrok URL
- **Proper deploy**: deploy the backend to AWS Fargate per `mahi80/planly`'s AWS plan

### AWS Fargate (production target)

`Dockerfile` lands in Session 4. Deploy via the same Fargate cluster as the backend's API service (per the project's `infra/terraform/` setup).

## Roadmap

| Status | Item | Notes |
|---|---|---|
| ✅ | Auth + nav layout | NextAuth v5, route protection, top-nav |
| 🚧 | Search + detail | Session 2 |
| 🚧 | Saved searches + letters | Session 3 |
| 🚧 | Leads kanban + admin + account + CI | Session 4 |
| ⏳ | Real Stripe checkout | Waits on Simon's pricing tier decision (Q28) |
| ⏳ | Cognito SSO | Swap NextAuth Credentials → Cognito provider when AWS P4 lands |
| ⏳ | Watch lists / weekly digest | Backend PR #31 is still draft |
| ⏳ | Letter PDF preview | Backend renders PDFs async via SQS; UI just shows status |
| ⏳ | Dark mode | shadcn theme vars make this a 1-line toggle |
| ⏳ | i18n | Single-locale English-only for now |
| ⏳ | Mobile-specific polish | Tailwind responsive utilities cover the basics |
| ⏳ | Bot/chatbot widget | Deferred to AWS P6 |

## Related

- Backend: [mahi80/planly](https://github.com/mahi80/planly)
- API spec: `http://localhost:8000/docs` (Swagger) or `/openapi.json` (raw)
- Feature spec for the former-district filter: [mahi80/planly#61](https://github.com/mahi80/planly/issues/61)
- AWS deployment plan: planly's `infra/README.md`

## Licence

Proprietary — © PD Intel Ltd
