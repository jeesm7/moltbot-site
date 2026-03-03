# Moltbot SaaS Deployment Guide

## ⚠️ Security First
**NEVER commit API keys or secrets to the repo.** All sensitive values go in Vercel Environment Variables only.

---

## 📋 Services to Set Up

### 1. Supabase

1. Go to https://supabase.com/dashboard/sign-up
2. Sign up with your credentials
3. Create new project:
   - Name: `moltbot`
   - Region: Frankfurt (EU Central)
4. After creation, go to **Settings > API**
5. Copy these values to **Vercel Environment Variables**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

6. **Run the database migration:**
   - Go to **SQL Editor** in Supabase dashboard
   - Copy entire contents of `supabase/migrations/001_initial_schema.sql`
   - Run the SQL

7. **Enable Email Auth:**
   - Go to **Authentication > Providers**
   - Ensure Email is enabled

---

### 2. Stripe

1. Go to https://dashboard.stripe.com/register
2. Sign up with your credentials
3. Enable **Test mode** (toggle in dashboard)
4. Go to **Developers > API keys**
5. Copy to **Vercel Environment Variables**:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

6. **Create Products & Prices:**
   After getting the API key, run locally:
   ```bash
   cd moltbot-saas
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY npx ts-node scripts/setup-stripe.ts
   ```
   This will output the price IDs. Add to Vercel:
   - `STRIPE_STARTER_PRICE_ID`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_USAGE_PRICE_ID`

7. **Set up Webhook:**
   - Go to **Developers > Webhooks**
   - Add endpoint: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

### 3. Hetzner Cloud

1. Go to https://console.hetzner.cloud/
2. Sign up / login
3. Create a new project called `moltbot`
4. Go to **Security > API Tokens**
5. Generate new token with Read & Write permissions
6. Copy → `HETZNER_API_TOKEN`

---

### 4. Anthropic

If you don't have an API key:
1. Go to https://console.anthropic.com/
2. Sign up and create an API key
3. Add to Vercel → `ANTHROPIC_API_KEY`

---

### 5. Vercel Deployment

1. Go to https://vercel.com
2. Sign in with GitHub
3. Import the `moltbot-saas` repository
4. Go to **Settings > Environment Variables**
5. Add ALL these variables (from steps above):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_STARTER_PRICE_ID
   STRIPE_PRO_PRICE_ID
   STRIPE_USAGE_PRICE_ID
   HETZNER_API_TOKEN
   ANTHROPIC_API_KEY
   NEXT_PUBLIC_APP_URL (your Vercel URL)
   ADMIN_EMAILS (your email)
   ```
6. Deploy!
7. After deploy, update the Stripe webhook URL with the actual Vercel URL

---

## ⏱️ Time Estimate
- Supabase setup: ~10 min
- Stripe setup: ~10 min  
- Hetzner setup: ~5 min
- Vercel deploy: ~5 min

**Total: ~30 minutes**

---

## 🔒 Security Checklist
- [ ] All API keys in Vercel Environment Variables only
- [ ] No secrets in `.env` files committed to repo
- [ ] Stripe using Test mode initially
- [ ] Service role key never exposed to client
