# Moltbot SaaS

Your own AI assistant, running 24/7. A managed Claude instance deployed on your private cloud server.

🌐 **Live**: [moltbot.ceo](https://moltbot.ceo)

## Features

- **Private AI Instance**: Dedicated Claude installation on your own server
- **Multi-Channel**: Connect Telegram, Email, Slack, Discord, SMS
- **Usage-Based Billing**: Pay only for what you use
- **Zero Setup**: We handle deployment, updates, monitoring
- **Enterprise Security**: Your data stays on your server

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS v4 + shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe (Subscriptions + Metered Billing) |
| Infrastructure | Hetzner Cloud |
| LLM | Claude (via Anthropic API) |
| Deployment | Vercel |

## Pricing

| Tier | Monthly | Usage | Overage |
|------|---------|-------|---------|
| **Starter** | $147 | Pay as you go | Cost + 20% |
| **Pro** | $297 | $75 included | Cost + 15% |
| **Trial** | Free 7 days | $10 cap | Upgrade required |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase account
- Stripe account
- Hetzner Cloud account
- Anthropic API key

### 1. Clone and Install

```bash
git clone https://github.com/ssejnosam32/moltbot-saas.git
cd moltbot-saas
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in all required environment variables (see below).

### 3. Set Up Supabase

1. Create project at [supabase.com](https://supabase.com/dashboard)
2. Run the migration:
   ```bash
   supabase db push
   ```
   Or manually execute `supabase/migrations/001_initial_schema.sql`
3. Enable Email auth provider
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://moltbot.ceo/auth/callback`

### 4. Set Up Stripe

1. Create products and prices:
   ```bash
   STRIPE_SECRET_KEY=sk_test_... npx ts-node scripts/setup-stripe.ts
   ```
2. Add the generated price IDs to `.env.local`
3. Set up webhook endpoint: `https://moltbot.ceo/api/stripe/webhook`
4. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── api/
│   │   ├── chat/            # LLM proxy endpoint
│   │   ├── instances/       # Instance management
│   │   ├── stripe/          # Billing endpoints
│   │   └── usage/           # Usage statistics
│   ├── auth/callback/       # OAuth callback
│   ├── dashboard/           # User dashboard
│   └── page.tsx             # Landing page
├── components/ui/           # shadcn/ui components
├── lib/
│   ├── hetzner/            # Hetzner Cloud API client
│   ├── llm/                # LLM proxy and usage tracking
│   ├── supabase/           # Supabase clients
│   ├── stripe.ts           # Stripe configuration
│   └── utils.ts            # Helper functions
scripts/
└── setup-stripe.ts          # Stripe product setup
supabase/
└── migrations/             # Database schema
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_USAGE_PRICE_ID=

# Hetzner
HETZNER_API_TOKEN=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://moltbot.ceo
```

## API Reference

### Chat API

```bash
POST /api/chat
Authorization: Bearer <session_token>

{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "system": "You are a helpful assistant."
}
```

### Instance API

```bash
# Deploy new instance
POST /api/instances/provision

# Get instance status
GET /api/instances/status
```

### Usage API

```bash
# Get usage statistics
GET /api/usage
```

## Deployment

### Vercel

1. Import repo from GitHub
2. Configure environment variables
3. Deploy
4. Set up custom domain

### Custom Domain (moltbot.ceo)

1. Add domain in Vercel project settings
2. Configure DNS:
   - CNAME: `@` → `cname.vercel-dns.com`
   - Or A: `@` → Vercel IP

## Development Roadmap

- [x] Phase 1: Foundation (Landing page)
- [x] Phase 2: Authentication (Supabase Auth)
- [x] Phase 3: Stripe Integration
- [x] Phase 4: Instance Deployment
- [x] Phase 5: LLM Proxy & Usage
- [x] Phase 6: Deployment Config
- [ ] Phase 7: Clawdbot Installation Automation
- [ ] Phase 8: Channel Integrations (Telegram, etc.)

## License

Proprietary. All rights reserved.

---

Built with ❤️ by the Moltbot team
