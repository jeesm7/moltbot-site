# Moltbot SaaS Build Log

## Architecture

```
moltbot.ceo
├── Marketing Site (landing, pricing, signup, onboarding)
├── Customer Dashboard (overview, usage, server, billing, settings)
└── Admin Dashboard (overview, customers, servers, usage, financials)
         │
         ▼
   API Backend (Next.js API Routes)
         │
    ┌────┴────┐
    ▼         ▼
Hetzner    LLM Proxy (Python/FastAPI) → Customer Server (Clawdbot)
```

---

## Phase 1: Foundation ✅

**Completed:**
- [x] Next.js 14 + Tailwind CSS v4 + shadcn/ui
- [x] Premium landing page with mesh gradient design
- [x] Database schema: customers, servers, usage_logs, usage_daily
- [x] RLS policies for all tables
- [x] Auto-create customer trigger on signup
- [x] Usage aggregation functions

**Files:**
- `scripts/setup_db.sql` - Complete database setup
- `src/app/page.tsx` - Landing page
- `src/app/(auth)/*` - Login/Signup pages

---

## Phase 2: Stripe Integration ✅

**Completed:**
- [x] Stripe setup script (`scripts/setup_stripe.py`)
- [x] Products: Starter ($147), Pro ($297), Metered Usage
- [x] Checkout session creation
- [x] Billing portal integration
- [x] Webhook handler at `/api/webhooks/stripe`
- [x] Events: checkout.session.completed, subscription.updated, subscription.deleted, invoice.paid, invoice.payment_failed

**Files:**
- `scripts/setup-stripe.ts` - Creates products/prices
- `src/lib/stripe.ts` - Stripe client + helpers
- `src/app/api/webhooks/stripe/route.ts` - Webhook handler
- `src/app/api/stripe/checkout/route.ts` - Checkout
- `src/app/api/stripe/portal/route.ts` - Billing portal

---

## Phase 3: LLM Proxy Service ✅

**Completed:**
- [x] FastAPI proxy service
- [x] OpenAI-compatible `/v1/chat/completions` endpoint
- [x] Multi-provider support via LiteLLM
- [x] Customer token authentication (JWT, Supabase, gateway)
- [x] Cost calculation per model
- [x] Usage logging to database
- [x] Stripe metered billing integration
- [x] Usage limits enforcement ($10 trial cap)

**Files:**
- `proxy/main.py` - FastAPI app
- `proxy/auth.py` - Token validation
- `proxy/billing.py` - Cost calculation + Stripe reporting
- `proxy/Dockerfile` - Container build
- `proxy/requirements.txt` - Python dependencies

**Pricing Table:**
| Model | Input $/1M | Output $/1M |
|-------|------------|-------------|
| gpt-4o | $2.50 | $10.00 |
| gpt-4o-mini | $0.15 | $0.60 |
| claude-sonnet-4 | $3.00 | $15.00 |
| claude-haiku-3.5 | $0.80 | $4.00 |
| gemini-1.5-pro | $1.25 | $5.00 |

---

## Phase 4: Server Deployment ✅

**Completed:**
- [x] Hetzner Cloud API client
- [x] Cloud-init script generator
- [x] Server creation with Clawdbot setup
- [x] Status tracking (deploying → active)
- [x] Ready callback endpoint
- [x] Server lifecycle (create, delete, reboot, power)

**Files:**
- `provisioning/hetzner.py` - Hetzner API client (deploy service)
- `provisioning/cloud_init.py` - Cloud-init generator (deploy service)
- `src/app/api/instances/*` - API routes

**Server Specs:**
- Type: CX22 (2 vCPU, 4GB RAM, 40GB SSD)
- Image: Ubuntu 24.04
- Region: fsn1 (Frankfurt)

---

## Phase 5: Customer Dashboard ✅

**Completed:**
- [x] Dashboard layout with sidebar
- [x] Overview page with stats
- [x] Usage page with daily breakdown
- [x] Billing page with plan selection
- [x] Server page with deployment
- [x] Settings page with profile management

**Files:**
- `src/app/dashboard/layout.tsx` - Shared layout
- `src/app/dashboard/page.tsx` - Overview
- `src/app/dashboard/usage/page.tsx` - Usage stats
- `src/app/dashboard/billing/page.tsx` - Plan management
- `src/app/dashboard/server/page.tsx` - Server management
- `src/app/dashboard/settings/page.tsx` - Account settings

---

## Phase 6: Marketing Site ✅

**Completed:**
- [x] Pricing page at `/pricing`
- [x] Post-signup onboarding flow at `/onboarding`
- [x] Deployment progress display with animated states
- [x] Redirects signup → onboarding → dashboard

**Files:**
- `src/app/pricing/page.tsx` - Pricing page
- `src/app/onboarding/page.tsx` - Onboarding flow
- `src/app/(auth)/signup/page.tsx` - Updated to redirect to onboarding

---

## Phase 7: Admin Dashboard ✅

**Completed:**
- [x] Admin-only access (ADMIN_EMAILS check)
- [x] Overview with MRR, customer count, server count
- [x] Customer list with plan badges
- [x] Server list with status tracking
- [x] Usage analytics page with charts
- [x] Financials page with revenue/cost breakdown

**Files:**
- `src/app/admin/layout.tsx` - Admin layout
- `src/app/admin/page.tsx` - Overview
- `src/app/admin/customers/page.tsx` - Customer management
- `src/app/admin/servers/page.tsx` - Server management
- `src/app/admin/usage/page.tsx` - Usage analytics
- `src/app/admin/financials/page.tsx` - Financial metrics

---

## Phase 8: Email Notifications ✅

**Completed:**
- [x] Email service with Resend integration
- [x] Welcome email (after signup)
- [x] Server ready notification
- [x] Payment failed alert
- [x] Payment successful receipt
- [x] Trial ending soon reminder
- [x] Trial ended notification
- [x] Cancellation confirmation
- [x] Usage alert email
- [x] Trial reminder cron job endpoint

**Files:**
- `src/lib/email.ts` - Email templates and send functions
- `src/app/api/cron/trial-reminders/route.ts` - Cron job for trial notifications
- Updated webhook handlers to send emails

---

## Phase 9: Hardening ✅

**Completed:**
- [x] Rate limiting utility (`src/lib/rate-limit.ts`)
- [x] Security headers via middleware
- [x] Error boundary components
- [x] Global error handling
- [x] 404 Not Found page
- [x] Loading states
- [x] Content Security Policy
- [x] Authentication middleware for protected routes

**Files:**
- `src/lib/rate-limit.ts` - Rate limiting utility
- `src/middleware.ts` - Auth + security headers
- `src/components/error-boundary.tsx` - Error boundary
- `src/app/error.tsx` - Error page
- `src/app/global-error.tsx` - Global error page
- `src/app/not-found.tsx` - 404 page
- `src/app/loading.tsx` - Loading state

---

## Phase 10: Deployment ✅

**Completed:**
- [x] Vercel configuration with cron jobs
- [x] Comprehensive deployment guide (DEPLOYMENT.md)
- [x] Build verified and passing
- [x] Environment variable documentation
- [x] CORS and security headers configured

**Manual Steps Required:**
- [ ] Import project to Vercel dashboard
- [ ] Configure environment variables in Vercel
- [ ] Add moltbot.ceo domain to Vercel
- [ ] Set up DNS records
- [ ] Deploy LLM proxy to Railway (optional)
- [ ] Configure Resend for email
- [ ] Switch Stripe to live mode

**Files:**
- `vercel.json` - Vercel deployment config with cron
- `DEPLOYMENT.md` - Step-by-step deployment guide
- `.env.example` - All required environment variables

---

## Repository

GitHub: https://github.com/ssejnosam32/moltbot-saas

## Running Locally

```bash
# Frontend
cd moltbot-saas
npm install
npm run dev

# Proxy (in another terminal)
cd proxy
pip install -r requirements.txt
python main.py
```

## Environment Variables

See `.env.example` for all required variables including:
- Supabase credentials
- Stripe keys and price IDs
- Hetzner API token
- LLM provider API keys
- Resend API key
- Cron secret

## Build Status

✅ TypeScript compiles successfully
✅ Build passes with lazy client initialization
✅ All 28 pages generated (static and dynamic)
✅ Ready for Vercel deployment

## Routes

**Static Pages:**
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/pricing` - Pricing page
- `/onboarding` - Onboarding flow

**Dynamic Pages:**
- `/dashboard/*` - Customer dashboard
- `/admin/*` - Admin dashboard
- `/api/*` - API routes

**Cron Jobs:**
- `/api/cron/trial-reminders` - Daily at 9 AM UTC
