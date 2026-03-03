# Moltbot SaaS Deployment Guide

## Overview

This guide walks through deploying the Moltbot SaaS platform:
- **Frontend**: Vercel (moltbot.ceo)
- **LLM Proxy**: Railway or Fly.io (api.moltbot.ceo)
- **Database**: Supabase (already set up)
- **Payments**: Stripe

## Prerequisites

1. Domain: `moltbot.ceo` (managed via your registrar)
2. Accounts:
   - [Vercel](https://vercel.com) (free tier works)
   - [Supabase](https://supabase.com) (already set up)
   - [Stripe](https://stripe.com) (account created)
   - [Hetzner](https://hetzner.cloud) (for server deployment)
   - [Resend](https://resend.com) (for emails)

---

## Step 1: Supabase Setup

If not already done:

```bash
# Run the database setup script
psql $DATABASE_URL -f scripts/setup_db.sql
```

Ensure these tables exist:
- `customers`
- `servers`
- `usage_logs`
- `usage_daily`

---

## Step 2: Stripe Setup

### Switch to Live Mode

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle from "Test mode" to "Live mode"
3. Create live products and prices:

```bash
# Update the script with live keys, then run:
npx ts-node scripts/setup-stripe.ts
```

### Webhook Configuration

1. Go to Developers > Webhooks
2. Add endpoint: `https://moltbot.ceo/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

---

## Step 3: Deploy Frontend to Vercel

### Option A: Via Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub: `ssejnosam32/moltbot-saas`
4. Configure:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Option B: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd moltbot-saas
vercel
```

### Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_METERED_PRICE=price_...

# Hetzner
HETZNER_API_TOKEN=...

# LLM Keys
ANTHROPIC_API_KEY=sk-ant-...

# Email (Resend)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@moltbot.ceo

# App
NEXT_PUBLIC_APP_URL=https://moltbot.ceo
ADMIN_EMAILS=jess@example.com

# Cron
CRON_SECRET=your-random-secret
```

### Domain Setup

1. In Vercel Project Settings > Domains
2. Add `moltbot.ceo`
3. Add DNS records to your registrar:
   - A record: `@` → Vercel's IP
   - CNAME: `www` → `cname.vercel-dns.com`

---

## Step 4: Deploy LLM Proxy (Optional)

The LLM proxy service is in `/proxy`. It's a FastAPI app that:
- Authenticates customers
- Routes to Claude/GPT/etc
- Tracks usage and bills customers

### Deploy to Railway

```bash
cd proxy

# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables for Proxy

```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LLM Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# App
CALLBACK_URL=https://moltbot.ceo/api/instances/ready
```

### Custom Domain

1. In Railway, add custom domain: `api.moltbot.ceo`
2. Add CNAME record to your registrar

---

## Step 5: Configure Cron Jobs

Vercel automatically runs the cron job defined in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

This runs daily at 9 AM UTC to:
- Send trial ending reminders (2 days before)
- Handle expired trials

---

## Step 6: Email Setup (Resend)

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add domain `moltbot.ceo`
3. Add DNS records:
   - SPF record
   - DKIM records
   - Return-Path CNAME

---

## Step 7: Test Deployment

### Verify Frontend

- [ ] Visit https://moltbot.ceo
- [ ] Sign up with test email
- [ ] Complete onboarding flow
- [ ] Check dashboard loads

### Verify Stripe

- [ ] Go to billing page
- [ ] Click upgrade button
- [ ] Verify redirect to Stripe Checkout
- [ ] Complete test payment
- [ ] Verify webhook received

### Verify Server Deployment

- [ ] Click "Deploy Agent" in dashboard
- [ ] Check Hetzner Console for new server
- [ ] Wait for ready callback
- [ ] Verify server IP shows in dashboard

### Verify Emails

- [ ] Check welcome email received
- [ ] Check server ready email
- [ ] Check payment confirmation

---

## Monitoring

### Vercel

- View logs in Vercel Dashboard > Deployments > [deployment] > Functions
- Monitor errors in Vercel Dashboard > Observability

### Stripe

- Monitor webhooks in Stripe Dashboard > Webhooks > [endpoint] > Events
- Check failed events and retry if needed

### Database

- Monitor in Supabase Dashboard > Database > Tables
- Check usage_logs for LLM usage tracking

---

## Rollback

If something goes wrong:

```bash
# Vercel - rollback to previous deployment
vercel rollback

# Or in dashboard:
# Deployments > [previous good deployment] > ... > Promote to Production
```

---

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] Stripe in live mode with real webhook secret
- [ ] HTTPS enforced on all endpoints
- [ ] Admin emails configured correctly
- [ ] Rate limiting enabled
- [ ] CORS configured for your domain only

---

## Support

For issues:
1. Check Vercel function logs
2. Check Stripe webhook logs
3. Check Supabase logs
4. Review this deployment guide

Need help? Contact support.
