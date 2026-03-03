# Deployment Flow Build Notes

## What Was Built

### The User Flow (3 steps)
1. **Connect Messaging App** — Pick Telegram, Discord, or WhatsApp. Each has a guided form with step-by-step instructions (e.g., "Go to @BotFather, send /newbot..."). Saved to Supabase.
2. **Add API Keys** — Enter Anthropic API key (required) + optional OpenAI key. These are BYOK (customer's own keys). Keys are passed to the server during deployment, never stored in our DB.
3. **Deploy Agent** — One click. Deploys a Hetzner CX22 VPS with everything pre-configured. ~2-3 min setup.

### What Happens When They Click "Launch"
1. Our API validates: active plan, channel configured, API key provided
2. Hetzner API creates an Ubuntu 24.04 VPS
3. Cloud-init script runs on first boot:
   - Installs Node.js 22
   - Clones & installs Moltbot from `github.com/moltbot/moltbot`
   - Writes customer's API keys to `/home/moltbot/.env`
   - Generates `clawdbot.json` with their messaging channel pre-configured
   - Sets up workspace: `SOUL.md`, `AGENTS.md`, `memory/` directory
   - Installs 3 skills: Agent Browser, Security Audit, Conversation Shield
   - Creates systemd service (auto-start, auto-restart on failure)
   - Starts the gateway
   - Calls back to `moltbot.ceo/api/instances/ready` with the server IP
4. Dashboard shows "Your bot is live! Message it at @YourBotName"

### Files Changed/Created
- `src/lib/hetzner/client.ts` — Full cloud-init generation, channel config types, BYOK support
- `src/app/api/instances/provision/route.ts` — Accepts channel_config_id + BYOK keys
- `src/app/api/instances/ready/route.ts` — Records IP, updates status, sends ready email
- `src/app/api/channels/route.ts` — NEW: CRUD API for channel configs with per-platform validation
- `src/app/dashboard/server/page.tsx` — Complete rewrite: 3-step setup flow + server management
- `src/components/dashboard/shell.tsx` — Mobile-responsive sidebar with hamburger menu
- `supabase/migrations/002_channel_configs.sql` — NEW: channel_configs table + RLS + server columns

### Before It's Live, Jess Needs To:
1. **Run the DB migration** — Apply `002_channel_configs.sql` in Supabase SQL editor
2. **Review the cloud-init** — The script installs from github.com/moltbot/moltbot. Make sure that repo exists and has the right structure (skills/ directory with agent-browser, dont-hack-me, prompt-guard)
3. **Test with a real deploy** — When ready, deploy one test server to verify cloud-init works end-to-end
4. **Deploy to Vercel** — Code is pushed but NOT deployed

### What's NOT built yet
- Server deletion/teardown from dashboard
- Config push to running servers (update channel, rotate keys)
- Multiple channels per server
- Usage tracking per customer server
- Server reboot/restart controls in dashboard
