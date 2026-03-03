#!/usr/bin/env python3
"""
Stripe Setup Script for Moltbot SaaS

Creates:
- Moltbot Starter product ($147/mo)
- Moltbot Pro product ($297/mo)
- LLM Usage metered price

Run: STRIPE_SECRET_KEY=sk_test_... python scripts/setup_stripe.py
"""

import os
import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

if not stripe.api_key:
    print("❌ Error: STRIPE_SECRET_KEY environment variable required")
    print("Run: STRIPE_SECRET_KEY=sk_test_... python scripts/setup_stripe.py")
    exit(1)

print("🚀 Setting up Stripe products for Moltbot SaaS...\n")

try:
    # Create Starter Product
    print("Creating Moltbot Starter product...")
    starter_product = stripe.Product.create(
        name="Moltbot Starter",
        description="Your own AI assistant - Pay as you go",
        metadata={
            "tier": "starter",
            "included_usage_usd": "0",
            "overage_markup": "0.20",
        },
    )
    print(f"✅ Product created: {starter_product.id}")

    # Create Starter Price ($147/mo)
    starter_price = stripe.Price.create(
        product=starter_product.id,
        unit_amount=14700,  # $147.00
        currency="usd",
        recurring={"interval": "month"},
        metadata={"tier": "starter"},
    )
    print(f"✅ Price created: {starter_price.id} ($147/month)\n")

    # Create Pro Product
    print("Creating Moltbot Pro product...")
    pro_product = stripe.Product.create(
        name="Moltbot Pro",
        description="Your own AI assistant - $75 usage included",
        metadata={
            "tier": "pro",
            "included_usage_usd": "75",
            "overage_markup": "0.15",
        },
    )
    print(f"✅ Product created: {pro_product.id}")

    # Create Pro Price ($297/mo)
    pro_price = stripe.Price.create(
        product=pro_product.id,
        unit_amount=29700,  # $297.00
        currency="usd",
        recurring={"interval": "month"},
        metadata={"tier": "pro"},
    )
    print(f"✅ Price created: {pro_price.id} ($297/month)\n")

    # Create Metered Usage Product
    print("Creating LLM Usage metered product...")
    usage_product = stripe.Product.create(
        name="Moltbot LLM Usage",
        description="Pay-per-use AI model costs",
        metadata={"type": "metered_usage"},
    )
    print(f"✅ Product created: {usage_product.id}")

    # Create Metered Price ($0.01 per unit, usage-based)
    usage_price = stripe.Price.create(
        product=usage_product.id,
        unit_amount=1,  # $0.01 per unit (we report cents)
        currency="usd",
        recurring={
            "interval": "month",
            "usage_type": "metered",
            "aggregate_usage": "sum",
        },
        metadata={"type": "metered_usage"},
    )
    print(f"✅ Metered price created: {usage_price.id}\n")

    # Output configuration
    print("=" * 60)
    print("Add these to your .env.local file:")
    print("=" * 60)
    print(f"STRIPE_PRICE_STARTER={starter_price.id}")
    print(f"STRIPE_PRICE_PRO={pro_price.id}")
    print(f"STRIPE_METERED_PRICE={usage_price.id}")
    print("=" * 60)

    print("\n✨ Stripe setup complete!")
    print("\nNext steps:")
    print("1. Add the price IDs to your .env.local")
    print("2. Set up webhook endpoint in Stripe Dashboard:")
    print("   URL: https://clawd.bot/api/webhooks/stripe")
    print("   Events: checkout.session.completed, customer.subscription.updated,")
    print("           customer.subscription.deleted, invoice.paid, invoice.payment_failed")

except stripe.error.StripeError as e:
    print(f"❌ Stripe error: {e}")
    exit(1)
