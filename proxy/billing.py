"""
Billing module for LLM Proxy

Handles:
- Cost calculation per model
- Usage logging to database
- Stripe metered billing
- Usage limit checking
"""

import os
from typing import Dict, Any
from datetime import datetime, date

import stripe
from supabase import create_client, Client

# Initialize clients
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# ============================================
# COST TABLES (USD per 1M tokens)
# ============================================

COSTS: Dict[str, Dict[str, float]] = {
    # OpenAI
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
    "o1": {"input": 15.00, "output": 60.00},
    "o1-mini": {"input": 3.00, "output": 12.00},
    
    # Anthropic
    "claude-opus-4-20250514": {"input": 15.00, "output": 75.00},
    "claude-sonnet-4-20250514": {"input": 3.00, "output": 15.00},
    "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
    "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00},
    "claude-3-opus-20240229": {"input": 15.00, "output": 75.00},
    "claude-3-sonnet-20240229": {"input": 3.00, "output": 15.00},
    "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
    
    # Google
    "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    
    # Groq (very cheap)
    "llama-3.3-70b-versatile": {"input": 0.59, "output": 0.79},
    "llama-3.1-8b-instant": {"input": 0.05, "output": 0.08},
    "mixtral-8x7b-32768": {"input": 0.24, "output": 0.24},
}

# Plan configurations
PLAN_CONFIG = {
    "trial": {"included_usd": 10, "markup": 0},
    "starter": {"included_usd": 0, "markup": 0.20},
    "pro": {"included_usd": 75, "markup": 0.15},
}


def calculate_cost(provider: str, model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost in USD for a request"""
    
    # Get pricing for model
    pricing = COSTS.get(model)
    
    if not pricing:
        # Default pricing if model not found
        pricing = {"input": 1.0, "output": 3.0}
        print(f"Warning: Unknown model {model}, using default pricing")
    
    input_cost = (input_tokens / 1_000_000) * pricing["input"]
    output_cost = (output_tokens / 1_000_000) * pricing["output"]
    
    return round(input_cost + output_cost, 6)


async def log_usage(
    customer_id: str,
    provider: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    cost_usd: float,
    request_id: str = None,
    channel: str = None,
) -> None:
    """Log usage to database"""
    
    try:
        # Insert usage log
        supabase.table("usage_logs").insert({
            "customer_id": customer_id,
            "provider": provider,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost_usd,
            "request_id": request_id,
            "channel": channel,
        }).execute()
        
        # Aggregate daily usage
        today = date.today().isoformat()
        supabase.rpc("aggregate_daily_usage", {
            "p_customer_id": customer_id,
            "p_date": today,
        }).execute()
        
    except Exception as e:
        print(f"Error logging usage: {e}")


async def check_usage_limits(customer_id: str, plan: str) -> Dict[str, Any]:
    """Check if customer is within usage limits"""
    
    if plan == "cancelled":
        return {"allowed": False, "reason": "Subscription cancelled"}
    
    # Get monthly usage
    try:
        result = supabase.rpc("get_monthly_usage", {
            "p_customer_id": customer_id
        }).execute()
        
        monthly_usage = float(result.data) if result.data else 0
    except Exception as e:
        print(f"Error getting monthly usage: {e}")
        monthly_usage = 0
    
    # Check trial limit ($10)
    if plan == "trial" and monthly_usage >= 10:
        return {
            "allowed": False,
            "reason": f"Trial usage limit reached (${monthly_usage:.2f}/$10.00)",
            "monthly_usage": monthly_usage,
        }
    
    return {
        "allowed": True,
        "monthly_usage": monthly_usage,
    }


async def report_to_stripe(
    customer_id: str,
    plan: str,
    cost_usd: float,
    subscription_id: str,
) -> None:
    """Report usage to Stripe for metered billing"""
    
    if plan not in ["starter", "pro"]:
        return
    
    config = PLAN_CONFIG.get(plan, {})
    included_usd = config.get("included_usd", 0)
    markup = config.get("markup", 0)
    
    try:
        # Get monthly usage to check if we're past included amount
        result = supabase.rpc("get_monthly_usage", {
            "p_customer_id": customer_id
        }).execute()
        monthly_usage = float(result.data) if result.data else 0
        
        # Pro: only bill overage above $75
        if plan == "pro" and monthly_usage <= included_usd:
            return
        
        # Calculate billable amount with markup
        billable_usd = cost_usd * (1 + markup)
        billable_cents = int(billable_usd * 100)
        
        if billable_cents <= 0:
            return
        
        # Get subscription to find metered item
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        metered_item = None
        for item in subscription["items"]["data"]:
            if item["price"]["recurring"] and item["price"]["recurring"].get("usage_type") == "metered":
                metered_item = item
                break
        
        if not metered_item:
            print(f"No metered item found on subscription {subscription_id}")
            return
        
        # Report usage
        stripe.SubscriptionItem.create_usage_record(
            metered_item["id"],
            quantity=billable_cents,
            action="increment",
        )
        
        print(f"Reported {billable_cents} cents to Stripe for {customer_id}")
        
    except Exception as e:
        print(f"Error reporting to Stripe: {e}")
