"""
Authentication module for LLM Proxy

Validates customer tokens and retrieves customer data.
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime

from jose import jwt, JWTError
from supabase import create_client, Client

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
)

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"


async def validate_customer_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validate a customer's API token and return customer data.
    
    Token can be:
    1. A JWT issued by our service
    2. A Supabase access token
    3. A gateway token from the customer's server
    """
    
    # Try JWT validation first
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        customer_id = payload.get("sub") or payload.get("customer_id")
        
        if customer_id:
            return await get_customer_by_id(customer_id)
    except JWTError:
        pass
    
    # Try as Supabase token
    try:
        # Verify with Supabase
        user = supabase.auth.get_user(token)
        if user and user.user:
            return await get_customer_by_id(user.user.id)
    except Exception:
        pass
    
    # Try as gateway token (from customer's server)
    try:
        result = supabase.table("servers").select(
            "customer_id"
        ).eq("gateway_token", token).eq("status", "active").execute()
        
        if result.data and len(result.data) > 0:
            customer_id = result.data[0]["customer_id"]
            return await get_customer_by_id(customer_id)
    except Exception:
        pass
    
    return None


async def get_customer_by_id(customer_id: str) -> Optional[Dict[str, Any]]:
    """Get customer data by ID"""
    try:
        result = supabase.table("customers").select(
            "id, email, plan, trial_ends_at, subscription_id, stripe_customer_id"
        ).eq("id", customer_id).execute()
        
        if result.data and len(result.data) > 0:
            customer = result.data[0]
            
            # Check trial expiry
            if customer["plan"] == "trial" and customer.get("trial_ends_at"):
                trial_ends = datetime.fromisoformat(customer["trial_ends_at"].replace("Z", "+00:00"))
                if trial_ends < datetime.now(trial_ends.tzinfo):
                    # Trial expired - update plan
                    supabase.table("customers").update(
                        {"plan": "cancelled"}
                    ).eq("id", customer_id).execute()
                    customer["plan"] = "cancelled"
            
            return customer
    except Exception as e:
        print(f"Error getting customer: {e}")
    
    return None


def create_customer_token(customer_id: str, expires_hours: int = 24 * 30) -> str:
    """Create a JWT token for a customer"""
    from datetime import timedelta
    
    payload = {
        "sub": customer_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=expires_hours),
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
