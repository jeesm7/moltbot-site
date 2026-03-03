# Moltbot Vertical SaaS Plan

*Created: Feb 23, 2026*

## The Idea

Instead of selling generic hosted OpenClaw, ship pre-built instances trained for specific industries. Customer opens Telegram day one and the AI already knows their business, has their workflows as skills, and a CRM template ready to go.

## What Already Exists

- Hetzner auto-provisioning (cloud-init, one-click deploy)
- Supabase auth + database
- Telegram bot auto-configuration
- Management SSH keys for remote access
- Onboarding flow (API key validation > deploy > ready)
- 40+ Skool members as initial distribution

## What's Missing

- Stripe billing (afternoon of work)
- Landing page per vertical
- Instance monitoring/alerting
- Industry-specific skill packs
- Support flow (SSH into customer instances)

## First Vertical: Recruitment

### Why Recruitment

- Highest volume of repetitive tasks (screening, outreach, JDs, follow-ups)
- Clear ROI: one placement = $10-30k fee, AI saves 10+ hours/week sourcing
- They already pay $300-500/mo for tools (LinkedIn Recruiter, Bullhorn, etc.)
- Tim Clarke (Quay Group) has 15k LinkedIn followers, all recruiters. Case study + distribution.
- Recruitment agencies talk. One adopts, competitors hear about it.

### Pre-Installed Skills (10)

1. `candidate-screener` - reads CV, scores against requirements
2. `outreach-writer` - personalized LinkedIn/email to candidates
3. `jd-generator` - brief in, polished JD out
4. `pipeline-tracker` - Notion CRM for candidates
5. `client-updater` - drafts status emails to clients
6. `market-intel` - monitors salary trends, job board activity
7. `follow-up-engine` - automated candidate nurture sequences
8. `interview-prepper` - prep docs for candidates before interviews
9. `placement-calculator` - fee calculations, margin tracking
10. `compliance-checker` - flags GDPR/right-to-work issues

### Pre-Configured

- SOUL.md written for recruitment industry
- Notion CRM template for candidate pipeline
- Heartbeat tuned to recruitment KPIs (placements/month, response rates, time-to-fill)
- First 10 prompts ready on day one

## Pricing

| Tier | Price | What They Get |
|------|-------|--------------|
| Self-serve | $149/mo | Hosted instance, all skills pre-loaded, cancel anytime |
| Managed | $499/mo | Custom skill tuning, their actual client list set up, AI voice matched to their brand |
| Enterprise | Custom | Multi-seat, custom integrations, Johann involvement |

67 self-serve customers = $10k/mo.

## Go-To-Market

1. Close Tim Clarke as first customer. Free 30 days. Use as case study.
2. Record setup + first week as YouTube video
3. Tim posts on LinkedIn (15k recruiter followers)
4. Landing page: recruitclaw.com or similar
5. Skool members who are in recruitment convert
6. Kevin Moturi (Power Moves) resells as channel partner at markup

## Channel Partner Model

- Partner price: $49-99/mo wholesale
- Partner sells at $149-249/mo, keeps the spread
- Kevin Moturi is the first channel partner candidate
- Every agency partner you sign brings 3-10 clients

## Revenue Projections (6 months)

- Month 1: 10-15 Skool conversions ($1,500-2,200/mo)
- Month 2: +10 YouTube signups, +5 managed ($2,500-3,500 added)
- Month 3: Tim Clarke case study live, LinkedIn distribution kicks in
- Month 4: Channel partners start bringing clients
- Month 6: $5-8k/mo from Moltbot alone

Combined with Skool ($1,960/mo) and consulting = $10k/mo target hit.

## Expansion Playbook

Once recruitment works, clone for next vertical. Same backend, new markdown files:

| Vertical | Product Name | Key Skills | Lead Source |
|----------|-------------|------------|-------------|
| Recruitment | RecruitClaw | CV screening, outreach, JD gen | Tim Clarke |
| Events/AV | EventClaw | Event planning, client comms, inventory | Shanaka Tennekoon |
| Real Estate | RealtyClaw | Listing gen, lead nurture, market reports | Nikolay Dimitrov |
| Insurance | InsureClaw | Quote gen, claims tracking, renewal alerts | Past leads |
| Law Firms | LegalClaw | Case intake, doc review, client updates | Past leads |

Each vertical is just: new SOUL.md + 10 skills + CRM template + landing page. Not a new product. New config.

## Key Insight

The consulting feeds the product. Every call teaches you what the industry actually needs. You update the skills. Product gets better. Next customer gets better experience. Flywheel.

## Next Steps

1. Finish Stripe integration
2. Build recruitment skill pack
3. Deploy Tim Clarke's instance (free pilot)
4. Record the YouTube video
5. Launch landing page
