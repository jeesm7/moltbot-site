"""
Cloud-Init Script Generator

Generates the cloud-init configuration that sets up:
- Docker and Docker Compose
- Node.js 22
- Clawdbot installation
- Automatic configuration
"""

import os

PROXY_URL = os.getenv("PROXY_URL", "https://api.clawd.bot")
APP_URL = os.getenv("NEXT_PUBLIC_APP_URL", "https://clawd.bot")


def generate_cloud_init(
    customer_id: str,
    customer_email: str,
    gateway_token: str,
) -> str:
    """Generate cloud-init script for Clawdbot installation"""
    
    return f'''#cloud-config
package_update: true
package_upgrade: true

packages:
  - docker.io
  - docker-compose
  - git
  - curl
  - jq
  - htop
  - ufw

runcmd:
  # ===========================================
  # SYSTEM SETUP
  # ===========================================
  
  # Enable Docker
  - systemctl enable docker
  - systemctl start docker
  
  # Configure firewall
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ssh
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable
  
  # Install Node.js 22
  - curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  - apt-get install -y nodejs
  
  # ===========================================
  # USER SETUP
  # ===========================================
  
  # Create moltbot user
  - useradd -m -s /bin/bash -G docker moltbot
  - mkdir -p /home/moltbot/clawd
  - chown -R moltbot:moltbot /home/moltbot
  
  # ===========================================
  # CLAWDBOT INSTALLATION
  # ===========================================
  
  # Download Clawdbot (placeholder - would be actual download)
  - |
    cat > /home/moltbot/clawd/.env << 'EOF'
    # Moltbot Customer Configuration
    CUSTOMER_ID={customer_id}
    CUSTOMER_EMAIL={customer_email}
    GATEWAY_TOKEN={gateway_token}
    
    # LLM Proxy (all API calls go through Moltbot proxy)
    LLM_PROXY_URL={PROXY_URL}
    LLM_PROXY_TOKEN={gateway_token}
    
    # Do NOT set API keys - they're provided by the proxy
    # ANTHROPIC_API_KEY=
    # OPENAI_API_KEY=
    
    # Clawdbot Config
    DEFAULT_MODEL=claude-sonnet-4-20250514
    EOF
  
  - chown moltbot:moltbot /home/moltbot/clawd/.env
  
  # Create systemd service for Clawdbot
  - |
    cat > /etc/systemd/system/clawdbot.service << 'EOF'
    [Unit]
    Description=Clawdbot AI Assistant
    After=network.target docker.service
    
    [Service]
    Type=simple
    User=moltbot
    WorkingDirectory=/home/moltbot/clawd
    ExecStart=/usr/bin/node /home/moltbot/clawd/index.js
    Restart=always
    RestartSec=10
    Environment=NODE_ENV=production
    
    [Install]
    WantedBy=multi-user.target
    EOF
  
  - systemctl daemon-reload
  - systemctl enable clawdbot
  
  # ===========================================
  # PHONE HOME
  # ===========================================
  
  # Get server IP
  - export SERVER_IP=$(curl -s http://169.254.169.254/hetzner/v1/metadata/public-ipv4)
  
  # Notify Moltbot that server is ready
  - |
    curl -X POST "{APP_URL}/api/instances/ready" \\
      -H "Content-Type: application/json" \\
      -d '{{"customer_id": "{customer_id}", "ip_address": "'$SERVER_IP'", "gateway_token": "{gateway_token}"}}'
  
  # Log completion
  - echo "Moltbot setup complete for customer {customer_id}" >> /var/log/moltbot-setup.log

final_message: "Moltbot instance ready for customer {customer_id} after $UPTIME seconds"

# Write setup timestamp
write_files:
  - path: /home/moltbot/moltbot-info.json
    content: |
      {{
        "customer_id": "{customer_id}",
        "customer_email": "{customer_email}",
        "setup_time": "$(date -Iseconds)",
        "proxy_url": "{PROXY_URL}"
      }}
    owner: moltbot:moltbot
    permissions: '0600'
'''
