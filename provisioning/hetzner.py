"""
Hetzner Cloud Server Provisioning

Handles:
- Creating VPS for new customers
- Installing Clawdbot via cloud-init
- Health monitoring
- Server teardown
"""

import os
import httpx
from typing import Optional, Dict, Any
from datetime import datetime

HETZNER_API = "https://api.hetzner.cloud/v1"
HETZNER_TOKEN = os.getenv("HETZNER_API_TOKEN")

# Default server configuration
DEFAULT_SERVER_TYPE = "cx22"  # 2 vCPU, 4GB RAM, 40GB SSD
DEFAULT_IMAGE = "ubuntu-24.04"
DEFAULT_LOCATION = "fsn1"  # Falkenstein, Germany


async def create_server(
    customer_id: str,
    customer_email: str,
    gateway_token: str,
    location: str = DEFAULT_LOCATION,
) -> Dict[str, Any]:
    """
    Create a new Hetzner VPS for a customer.
    
    Returns:
        {
            "server_id": "123456",
            "ip_address": "1.2.3.4",
            "status": "provisioning",
            "root_password": "..."
        }
    """
    
    if not HETZNER_TOKEN:
        raise ValueError("HETZNER_API_TOKEN not configured")
    
    # Generate server name
    name_suffix = customer_id[:8].replace("-", "")
    server_name = f"moltbot-{name_suffix}"
    
    # Get cloud-init script
    from cloud_init import generate_cloud_init
    user_data = generate_cloud_init(
        customer_id=customer_id,
        customer_email=customer_email,
        gateway_token=gateway_token,
    )
    
    # Create server
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HETZNER_API}/servers",
            headers={
                "Authorization": f"Bearer {HETZNER_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "name": server_name,
                "server_type": DEFAULT_SERVER_TYPE,
                "image": DEFAULT_IMAGE,
                "location": location,
                "start_after_create": True,
                "user_data": user_data,
                "labels": {
                    "service": "moltbot",
                    "customer_id": customer_id,
                    "managed": "true",
                },
            },
            timeout=60.0,
        )
        
        if response.status_code != 201:
            error = response.json()
            raise Exception(f"Hetzner API error: {error}")
        
        data = response.json()
        server = data["server"]
        root_password = data.get("root_password")
        
        return {
            "server_id": str(server["id"]),
            "name": server["name"],
            "ip_address": server["public_net"]["ipv4"]["ip"],
            "status": "provisioning",
            "root_password": root_password,
            "datacenter": server["datacenter"]["name"],
        }


async def get_server(server_id: str) -> Optional[Dict[str, Any]]:
    """Get server status from Hetzner"""
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{HETZNER_API}/servers/{server_id}",
            headers={"Authorization": f"Bearer {HETZNER_TOKEN}"},
            timeout=30.0,
        )
        
        if response.status_code == 404:
            return None
        
        if response.status_code != 200:
            raise Exception(f"Hetzner API error: {response.text}")
        
        server = response.json()["server"]
        
        return {
            "server_id": str(server["id"]),
            "name": server["name"],
            "ip_address": server["public_net"]["ipv4"]["ip"],
            "status": server["status"],
            "datacenter": server["datacenter"]["name"],
        }


async def delete_server(server_id: str) -> bool:
    """Delete a server from Hetzner"""
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{HETZNER_API}/servers/{server_id}",
            headers={"Authorization": f"Bearer {HETZNER_TOKEN}"},
            timeout=30.0,
        )
        
        return response.status_code in [200, 204]


async def reboot_server(server_id: str) -> bool:
    """Reboot a server"""
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HETZNER_API}/servers/{server_id}/actions/reboot",
            headers={"Authorization": f"Bearer {HETZNER_TOKEN}"},
            timeout=30.0,
        )
        
        return response.status_code == 201


async def power_on(server_id: str) -> bool:
    """Power on a server"""
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HETZNER_API}/servers/{server_id}/actions/poweron",
            headers={"Authorization": f"Bearer {HETZNER_TOKEN}"},
            timeout=30.0,
        )
        
        return response.status_code == 201


async def power_off(server_id: str) -> bool:
    """Power off a server (graceful shutdown)"""
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{HETZNER_API}/servers/{server_id}/actions/shutdown",
            headers={"Authorization": f"Bearer {HETZNER_TOKEN}"},
            timeout=30.0,
        )
        
        return response.status_code == 201


async def list_moltbot_servers() -> list:
    """List all Moltbot-managed servers"""
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{HETZNER_API}/servers",
            headers={"Authorization": f"Bearer {HETZNER_TOKEN}"},
            params={"label_selector": "service=moltbot"},
            timeout=30.0,
        )
        
        if response.status_code != 200:
            return []
        
        return [
            {
                "server_id": str(s["id"]),
                "name": s["name"],
                "ip_address": s["public_net"]["ipv4"]["ip"],
                "status": s["status"],
                "customer_id": s["labels"].get("customer_id"),
            }
            for s in response.json()["servers"]
        ]
