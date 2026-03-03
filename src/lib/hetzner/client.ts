/**
 * Hetzner Cloud API Client
 *
 * Handles server deployment for Moltbot instances.
 * Generates production cloud-init scripts that install Clawdbot
 * with pre-configured messaging channels, skills, and workspace files.
 */

const HETZNER_API_URL = 'https://api.hetzner.cloud/v1';

interface HetznerServer {
  id: number;
  name: string;
  status: string;
  public_net: {
    ipv4: {
      ip: string;
    };
    ipv6: {
      ip: string;
    };
  };
  server_type: {
    name: string;
  };
  datacenter: {
    name: string;
  };
}

interface CreateServerResponse {
  server: HetznerServer;
  root_password: string;
}

interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ── Channel config types ──────────────────────────────────────────

export interface TelegramChannelConfig {
  platform: 'telegram';
  bot_token: string;
  bot_username?: string;
}

export interface DiscordChannelConfig {
  platform: 'discord';
  bot_token: string;
  app_id: string;
}

export interface WhatsAppChannelConfig {
  platform: 'whatsapp';
  phone_number_id: string;
  access_token: string;
  business_id?: string;
}

export type ChannelConfig = TelegramChannelConfig | DiscordChannelConfig | WhatsAppChannelConfig;

// ── Cloud-init generation ─────────────────────────────────────────

/**
 * Build the clawdbot.json configuration for a customer's instance.
 * This gets written during cloud-init so the bot starts with zero manual setup.
 */
function buildClawdbotConfig(channel: ChannelConfig): object {
  const config: Record<string, unknown> = {
    meta: {
      lastTouchedVersion: 'moltbot-provisioned',
      lastTouchedAt: new Date().toISOString(),
    },
    wizard: {
      // Mark wizard as already run so it never prompts interactively
      lastRunAt: new Date().toISOString(),
      lastRunVersion: 'moltbot-provisioned',
      lastRunCommand: 'provision',
      lastRunMode: 'local',
    },
    agents: {
      defaults: {
        workspace: '/home/moltbot/clawd',
        compaction: { mode: 'safeguard' },
        maxConcurrent: 2,
        subagents: { maxConcurrent: 4 },
      },
    },
    tools: {
      web: {
        search: { enabled: false },
      },
    },
    browser: {
      enabled: false,
    },
    messages: {
      ackReactionScope: 'group-mentions',
    },
    commands: {
      native: 'auto',
      nativeSkills: 'auto',
    },
    gateway: {
      mode: 'local',
    },
  };

  // Build channel-specific config
  switch (channel.platform) {
    case 'telegram':
      config.channels = {
        telegram: {
          enabled: true,
          dmPolicy: 'open',
          botToken: channel.bot_token,
          groupPolicy: 'allowlist',
          streamMode: 'partial',
        },
      };
      config.plugins = {
        entries: {
          telegram: { enabled: true },
        },
      };
      break;

    case 'discord':
      config.channels = {
        discord: {
          enabled: true,
          dmPolicy: 'open',
          botToken: channel.bot_token,
          appId: channel.app_id,
          groupPolicy: 'allowlist',
        },
      };
      config.plugins = {
        entries: {
          discord: { enabled: true },
        },
      };
      break;

    case 'whatsapp':
      config.channels = {
        whatsapp: {
          enabled: true,
          dmPolicy: 'open',
          phoneNumberId: channel.phone_number_id,
          accessToken: channel.access_token,
          groupPolicy: 'allowlist',
        },
      };
      config.plugins = {
        entries: {
          whatsapp: { enabled: true },
        },
      };
      break;
  }

  return config;
}

/**
 * Generate the SOUL.md workspace file (branded for Moltbot customers).
 */
function generateSoulMd(): string {
  return `# Moltbot AI Assistant

You are a helpful, friendly AI assistant powered by Moltbot.

## Personality
- Clear, concise, and helpful
- Professional but approachable
- You proactively offer solutions and suggestions
- You remember context within conversations

## Guidelines
- Be honest about what you can and cannot do
- Ask clarifying questions when requests are ambiguous
- Keep responses focused and actionable
- Use formatting (bold, lists, code blocks) to improve readability
- Respect user privacy and handle sensitive information carefully

## What You Can Do
- Answer questions and have conversations
- Help with writing, editing, and brainstorming
- Analyze data and provide insights
- Help with coding and technical questions
- Browse the web for current information (when enabled)
- Run skills for specialized tasks

## What You Should Not Do
- Share private user data with anyone
- Run destructive commands without explicit confirmation
- Make up information when you are unsure
- Send external messages (emails, posts) without permission
`;
}

/**
 * Generate the AGENTS.md workspace file.
 */
function generateAgentsMd(): string {
  return `# AGENTS.md

## Workspace
This is your working directory. Read SOUL.md at the start of every session.

## Memory
- Write important context to \`memory/\` directory
- Create daily notes in \`memory/YYYY-MM-DD.md\`
- Review recent memory files at session start

## Safety
- Never exfiltrate private data
- Never run destructive commands without asking
- When in doubt, ask the user

## Skills
Check the \`skills/\` directory for available capabilities.
Each skill has a \`SKILL.md\` with usage instructions.
`;
}

/**
 * Generate the full cloud-init script for a Moltbot instance.
 * This runs on first boot of the Hetzner VPS.
 */
function generateCloudInit(
  userId: string,
  channel: ChannelConfig,
  anthropicApiKey: string,
  openaiApiKey: string | undefined,
  callbackSecret: string
): string {
  const clawdbotConfig = buildClawdbotConfig(channel);
  const configJson = JSON.stringify(clawdbotConfig, null, 2);
  const soulMd = generateSoulMd();
  const agentsMd = generateAgentsMd();

  // Determine the bot display name for the callback
  let botDisplayName = '';
  if (channel.platform === 'telegram' && channel.bot_username) {
    botDisplayName = `@${channel.bot_username}`;
  }

  // We use a shell script (runcmd) approach for maximum control.
  // All heredocs use unique delimiters to avoid conflicts.
  return `#!/bin/bash
set -euo pipefail

exec > /var/log/moltbot-provision.log 2>&1
echo "=== Moltbot provisioning started at $(date -u) ==="

# ── 1. System updates ─────────────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Firewall (UFW) ─────────────────────────────────────────────
echo "Configuring firewall..."
apt-get install -y -qq ufw
ufw default deny incoming
ufw default allow outgoing
# SSH only — Moltbot uses outbound polling, no inbound HTTP needed
ufw allow 22/tcp comment 'SSH'
ufw --force enable
echo "Firewall active: deny all inbound except SSH."

# ── 3. SSH Hardening ──────────────────────────────────────────────
echo "Hardening SSH..."
# Disable root login
sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
# Disable password authentication (key-only)
sed -i 's/^#\\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
# Disable empty passwords
sed -i 's/^#\\?PermitEmptyPasswords.*/PermitEmptyPasswords no/' /etc/ssh/sshd_config
# Disable X11 forwarding
sed -i 's/^#\\?X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
# Limit auth attempts
sed -i 's/^#\\?MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
# Idle timeout (10 min)
sed -i 's/^#\\?ClientAliveInterval.*/ClientAliveInterval 300/' /etc/ssh/sshd_config
sed -i 's/^#\\?ClientAliveCountMax.*/ClientAliveCountMax 2/' /etc/ssh/sshd_config
systemctl restart sshd
echo "SSH hardened: root login disabled, password auth disabled, key-only."

# ── 4. fail2ban ───────────────────────────────────────────────────
echo "Installing fail2ban..."
apt-get install -y -qq fail2ban
cat > /etc/fail2ban/jail.local <<'FAIL2BAN_EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
banaction = ufw

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
FAIL2BAN_EOF
systemctl enable fail2ban
systemctl restart fail2ban
echo "fail2ban active: 3 failed SSH attempts = 1 hour ban."

# ── 5. Automatic security updates ────────────────────────────────
echo "Enabling automatic security updates..."
apt-get install -y -qq unattended-upgrades apt-listchanges
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'AUTOUPDATE_EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
AUTOUPDATE_EOF
echo "Automatic security updates enabled."

# ── 6. Kernel network hardening ───────────────────────────────────
echo "Applying kernel network hardening..."
cat > /etc/sysctl.d/99-moltbot-hardening.conf <<'SYSCTL_EOF'
# Ignore ICMP redirects (prevent MITM)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
# Don't send ICMP redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
# Ignore source-routed packets
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0
# Enable SYN flood protection
net.ipv4.tcp_syncookies = 1
# Log suspicious packets
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
# Ignore ICMP broadcasts
net.ipv4.icmp_echo_ignore_broadcasts = 1
# Ignore bogus ICMP errors
net.ipv4.icmp_ignore_bogus_error_responses = 1
# Enable reverse path filtering (anti-spoofing)
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
SYSCTL_EOF
sysctl --system > /dev/null 2>&1
echo "Kernel hardening applied."

# ── 7. Install Node.js 22 LTS ─────────────────────────────────────
echo "Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y -qq nodejs
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# ── 8. Install Moltbot from source ────────────────────────────────
echo "Installing Moltbot..."
apt-get install -y -qq git
cd /opt
git clone https://github.com/moltbot/moltbot.git /opt/moltbot
cd /opt/moltbot
npm install
npm link
echo "Moltbot installed from source"
# Create moltbot alias for the openclaw binary
OPENCLAW_BIN=$(which openclaw 2>/dev/null || echo "/usr/lib/node_modules/openclaw/openclaw.mjs")
if [ -f "$OPENCLAW_BIN" ]; then
  ln -sf "$OPENCLAW_BIN" /usr/local/bin/moltbot
  echo "Created moltbot -> openclaw symlink"
fi

# ── 9. Create moltbot system user ────────────────────────────────
echo "Creating moltbot user..."
useradd -m -s /bin/bash moltbot || true

# ── 10. Write API keys (customer BYOK) ───────────────────────────
echo "Configuring API keys..."
cat > /home/moltbot/.env <<MOLTBOT_ENV_EOF
ANTHROPIC_API_KEY=${anthropicApiKey}
${openaiApiKey ? `OPENAI_API_KEY=${openaiApiKey}` : '# OPENAI_API_KEY not provided'}
MOLTBOT_USER_ID=${userId}
MOLTBOT_ENV_EOF
chmod 600 /home/moltbot/.env
chown moltbot:moltbot /home/moltbot/.env

# ── 11. Write clawdbot.json config ───────────────────────────────
echo "Writing clawdbot.json..."
mkdir -p /home/moltbot/.clawdbot
cat > /home/moltbot/.clawdbot/clawdbot.json <<'CLAWDBOT_CONFIG_EOF'
${configJson}
CLAWDBOT_CONFIG_EOF
chmod 600 /home/moltbot/.clawdbot/clawdbot.json
chown -R moltbot:moltbot /home/moltbot/.clawdbot

# ── 12. Create workspace directory ────────────────────────────────
echo "Setting up workspace..."
mkdir -p /home/moltbot/clawd/memory
mkdir -p /home/moltbot/clawd/skills

# ── 13. Write SOUL.md ────────────────────────────────────────────
cat > /home/moltbot/clawd/SOUL.md <<'SOUL_MD_EOF'
${soulMd}
SOUL_MD_EOF

# ── 14. Write AGENTS.md ──────────────────────────────────────────
cat > /home/moltbot/clawd/AGENTS.md <<'AGENTS_MD_EOF'
${agentsMd}
AGENTS_MD_EOF

# ── 15. Install skills ───────────────────────────────────────────
echo "Installing skills..."
MOLTBOT_SKILLS_DIR=/opt/moltbot/skills

# agent-browser (keep original name)
if [ -d "$MOLTBOT_SKILLS_DIR/agent-browser" ]; then
  cp -r "$MOLTBOT_SKILLS_DIR/agent-browser" /home/moltbot/clawd/skills/agent-browser
  echo "  Installed: agent-browser"
fi

# dont-hack-me -> Security Audit
if [ -d "$MOLTBOT_SKILLS_DIR/dont-hack-me" ]; then
  cp -r "$MOLTBOT_SKILLS_DIR/dont-hack-me" /home/moltbot/clawd/skills/security-audit
  # Rename in SKILL.md
  if [ -f /home/moltbot/clawd/skills/security-audit/SKILL.md ]; then
    sed -i '1s/.*/# Security Audit/' /home/moltbot/clawd/skills/security-audit/SKILL.md
  fi
  echo "  Installed: Security Audit"
fi

# prompt-guard -> Conversation Shield
if [ -d "$MOLTBOT_SKILLS_DIR/prompt-guard" ]; then
  cp -r "$MOLTBOT_SKILLS_DIR/prompt-guard" /home/moltbot/clawd/skills/conversation-shield
  # Rename in SKILL.md
  if [ -f /home/moltbot/clawd/skills/conversation-shield/SKILL.md ]; then
    sed -i '1s/.*/# Conversation Shield/' /home/moltbot/clawd/skills/conversation-shield/SKILL.md
  fi
  echo "  Installed: Conversation Shield"
fi

# Fix ownership
chown -R moltbot:moltbot /home/moltbot/clawd

# ── 16. Create systemd service ───────────────────────────────────
echo "Creating systemd service..."
cat > /etc/systemd/system/clawdbot.service <<'SYSTEMD_EOF'
[Unit]
Description=Moltbot Gateway
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=moltbot
Group=moltbot
WorkingDirectory=/home/moltbot/clawd
EnvironmentFile=/home/moltbot/.env
ExecStart=/usr/local/bin/moltbot gateway start --foreground
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=clawdbot

# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/moltbot/clawd /home/moltbot/.clawdbot /tmp
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictNamespaces=true
RestrictSUIDSGID=true
MemoryDenyWriteExecute=false
LockPersonality=true

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

systemctl daemon-reload
systemctl enable clawdbot.service
systemctl start clawdbot.service
echo "Clawdbot service started."

# ── 17. Generate management SSH keypair ──────────────────────────
echo "Generating management SSH keypair..."
mkdir -p /home/moltbot/.ssh
ssh-keygen -t ed25519 -f /home/moltbot/.ssh/mgmt_key -N "" -C "moltbot-mgmt"
cat /home/moltbot/.ssh/mgmt_key.pub >> /home/moltbot/.ssh/authorized_keys
chmod 700 /home/moltbot/.ssh
chmod 600 /home/moltbot/.ssh/authorized_keys
chown -R moltbot:moltbot /home/moltbot/.ssh
MGMT_PRIVATE_KEY=$(cat /home/moltbot/.ssh/mgmt_key)
# Remove the private key file from disk after reading (SaaS stores it)
rm -f /home/moltbot/.ssh/mgmt_key
echo "Management SSH keypair generated."

# ── 18. Signal ready to Moltbot SaaS ─────────────────────────────
echo "Sending ready callback..."
SERVER_IP=$(curl -sf http://169.254.169.254/hetzner/v1/metadata/public-ipv4 || hostname -I | awk '{print $1}')

# Build callback JSON with the SSH private key
CALLBACK_JSON=$(cat <<CALLBACK_JSON_EOF
{
  "customer_id": "${userId}",
  "ip_address": "$SERVER_IP",
  "bot_display_name": "${botDisplayName}",
  "ssh_private_key": $(echo "$MGMT_PRIVATE_KEY" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')
}
CALLBACK_JSON_EOF
)

# Retry callback up to 5 times with backoff
for i in 1 2 3 4 5; do
  HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \\
    -X POST "https://moltbot.ceo/api/instances/ready" \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${callbackSecret}" \\
    -d "$CALLBACK_JSON" 2>/dev/null) || true

  if [ "$HTTP_CODE" = "200" ]; then
    echo "Ready callback sent successfully."
    break
  fi
  echo "Callback attempt $i failed (HTTP $HTTP_CODE), retrying in $((i * 5))s..."
  sleep $((i * 5))
done

# ── 19. Post-provision cleanup ────────────────────────────────────
echo "Cleaning up sensitive provisioning data..."
# Clear cloud-init logs that contain API keys
: > /var/log/cloud-init-output.log 2>/dev/null || true
# Remove cloud-init instance data (contains user-data with API keys)
rm -rf /var/lib/cloud/instance/user-data.txt 2>/dev/null || true
rm -rf /var/lib/cloud/instance/scripts/ 2>/dev/null || true
# Clear bash history for root
: > /root/.bash_history 2>/dev/null || true
history -c 2>/dev/null || true
echo "Provisioning data cleaned."

echo "=== Moltbot provisioning complete at $(date -u) ==="
echo "Security: UFW firewall (SSH only), fail2ban, SSH hardened, auto-updates enabled."
`;
}

// ── Hetzner API Client ────────────────────────────────────────────

class HetznerClient {
  private apiToken: string | null = null;

  private getApiToken(): string {
    if (!this.apiToken) {
      this.apiToken = process.env.HETZNER_API_TOKEN || '';
      if (!this.apiToken) {
        throw new Error('HETZNER_API_TOKEN not configured');
      }
    }
    return this.apiToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${HETZNER_API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.getApiToken()}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(`Hetzner API error: ${error.error.message}`);
    }

    return data as T;
  }

  /**
   * Create a new server for a Moltbot instance.
   * Generates a full cloud-init script that installs Clawdbot,
   * configures the messaging channel, installs skills, and starts the gateway.
   */
  async createServer(
    userId: string,
    name: string,
    channel: ChannelConfig,
    anthropicApiKey: string,
    openaiApiKey?: string,
    region: string = 'fsn1'
  ): Promise<CreateServerResponse> {
    const callbackSecret = process.env.PROVISION_CALLBACK_SECRET;
    if (!callbackSecret) {
      throw new Error('PROVISION_CALLBACK_SECRET not configured.');
    }

    const cloudInit = generateCloudInit(userId, channel, anthropicApiKey, openaiApiKey, callbackSecret);

    const response = await this.request<CreateServerResponse>('/servers', {
      method: 'POST',
      body: JSON.stringify({
        name: `moltbot-${name}`,
        server_type: 'cx22', // 2 vCPU, 4GB RAM
        image: 'ubuntu-24.04',
        location: region,
        start_after_create: true,
        user_data: cloudInit,
        labels: {
          service: 'moltbot',
          user_id: userId,
        },
      }),
    });

    return response;
  }

  /**
   * Get server status
   */
  async getServer(serverId: string): Promise<HetznerServer> {
    const response = await this.request<{ server: HetznerServer }>(
      `/servers/${serverId}`
    );
    return response.server;
  }

  /**
   * Delete a server
   */
  async deleteServer(serverId: string): Promise<void> {
    await this.request(`/servers/${serverId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Reboot a server
   */
  async rebootServer(serverId: string): Promise<void> {
    await this.request(`/servers/${serverId}/actions/reboot`, {
      method: 'POST',
    });
  }

  /**
   * Power on a server
   */
  async powerOnServer(serverId: string): Promise<void> {
    await this.request(`/servers/${serverId}/actions/poweron`, {
      method: 'POST',
    });
  }

  /**
   * Power off a server (graceful)
   */
  async powerOffServer(serverId: string): Promise<void> {
    await this.request(`/servers/${serverId}/actions/shutdown`, {
      method: 'POST',
    });
  }

  /**
   * List all Moltbot servers
   */
  async listServers(): Promise<HetznerServer[]> {
    const response = await this.request<{ servers: HetznerServer[] }>(
      '/servers?label_selector=service=moltbot'
    );
    return response.servers;
  }
}

export const hetzner = new HetznerClient();
export type { HetznerServer, CreateServerResponse };
