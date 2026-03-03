# MoltBot SaaS - What Jess Needs To Do

**Last updated:** 2026-01-29

## Status

| Item | Status | Notes |
|------|--------|-------|
| Codebase | ✅ Ready | All domain refs updated to moltbot.ceo |
| GitHub | ✅ Pushed | github.com/ssejnosam32/moltbot-saas |
| Supabase | ✅ Set up | DB ready, env vars on Vercel |
| Vercel | ✅ Deployed | moltbot-saas.vercel.app (live!) |
| Domain (Vercel) | ✅ Added | moltbot.ceo + www.moltbot.ceo configured |
| DNS Records | 🔲 Jess | Add A + CNAME records on Porkbun |
| Stripe | 🔲 Jess | Create account + send API keys |
| Hetzner | 🔲 Jess | Create account + send API token |
| Resend (email) | 🔲 Jess | Create account + send API key |
| LLM Keys | 🔲 Jess | Anthropic + OpenAI keys with billing |

---

## Step 1: DNS Records on Porkbun (DO NOT change nameservers)

**IMPORTANT: Keep Porkbun's default nameservers. Just add these records:**

1. Go to **porkbun.com** > log in > **Domain Management**
2. Click the **DNS** link next to **moltbot.ceo**
3. Add these records:

| Type | Host | Value |
|------|------|-------|
| **A** | *(leave blank or @)* | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

4. Save. Takes 5-30 min to propagate.

---

## Step 2: Stripe Account

1. Go to **stripe.com** > **Start now**
2. Sign up with `ssejnosam32@gmail.com` / `MrClawdBot123!!`
   - Country: **Canada**
3. Once logged in, go to **Developers** > **API keys**
4. Copy and send me:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)
5. I'll set up the products, prices, and webhooks from there.

---

## Step 3: Hetzner Account

1. Go to **hetzner.cloud** > **Register**
2. Sign up (any email, can use ssejnosam32@gmail.com)
3. Add a payment method (credit card)
4. Go to **Security** > **API Tokens** > **Generate API Token**
   - Name: `moltbot`
   - Permissions: **Read & Write**
5. Copy the token and send it to me.

---

## Step 4: Resend (Email Service)

1. Go to **resend.com** > **Get Started**
2. Sign up with `ssejnosam32@gmail.com`
3. Go to **API Keys** > **Create API Key**
   - Name: `moltbot`
   - Permissions: **Full access**
4. Copy the API key (starts with `re_...`) and send it to me.
5. Then go to **Domains** > **Add Domain** > enter `moltbot.ceo`
   - It'll give you DNS records to add on Porkbun (SPF, DKIM, etc.)
   - Send me those records or I'll add them once I have Porkbun access

---

## Step 5: LLM API Keys

These are the managed keys customers will use (we mark up usage):

1. **Anthropic** (anthropic.com/dashboard)
   - Create account or use existing
   - Add billing (credit card)
   - Create API key, send it to me

2. **OpenAI** (platform.openai.com)
   - Create account or use existing
   - Add billing (credit card)
   - Create API key, send it to me

---

## What Jarvis Handles After

Once I have the above, I will:
- [ ] Add all env vars to Vercel
- [ ] Set up Stripe products (Starter $147/mo, Pro $297/mo)
- [ ] Configure Stripe webhooks
- [ ] Add email DNS records (SPF/DKIM) to Porkbun
- [ ] Redeploy with all services connected
- [ ] Test the full signup > payment > server deployment flow
- [ ] Hand off a working product

---

## Quick Test (Right Now)

The site is already live at: **https://moltbot-saas.vercel.app**

It won't fully work yet (no Stripe, no auth callback configured), but you can see the landing page and signup flow.
