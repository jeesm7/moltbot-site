import Stripe from 'stripe';

// Lazy-initialized Stripe client
let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeClient;
}

// For backward compatibility
export const stripe = {
  get customers() { return getStripeClient().customers; },
  get checkout() { return getStripeClient().checkout; },
  get billingPortal() { return getStripeClient().billingPortal; },
  get subscriptions() { return getStripeClient().subscriptions; },
  get subscriptionItems() { return getStripeClient().subscriptionItems; },
  get webhooks() { return getStripeClient().webhooks; },
};

// Price IDs from Stripe (set via setup_stripe.py or scripts/create_stripe_price.ts)
export const PRICES = {
  moltbot: process.env.STRIPE_PRICE_MOLTBOT!,
  // Legacy (unused, kept for existing subscriptions)
  starter: process.env.STRIPE_PRICE_STARTER || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  metered: process.env.STRIPE_METERED_PRICE || '',
};

// Plan configurations
export const PLAN_CONFIG = {
  trial: {
    name: 'Trial',
    price: 0,
    includedUsageUsd: 0, // BYOK — users pay Anthropic directly
    overageMarkup: 0,
    canProvision: true,
  },
  moltbot: {
    name: 'Moltbot',
    price: 19.97,
    includedUsageUsd: 0, // BYOK — users pay Anthropic directly
    overageMarkup: 0,
    canProvision: true,
  },
  // Legacy plans (kept for existing subscriptions)
  starter: {
    name: 'Starter (Legacy)',
    price: 147,
    includedUsageUsd: 0,
    overageMarkup: 0.20,
    canProvision: true,
  },
  pro: {
    name: 'Pro (Legacy)',
    price: 297,
    includedUsageUsd: 75,
    overageMarkup: 0.15,
    canProvision: true,
  },
  cancelled: {
    name: 'Cancelled',
    price: 0,
    includedUsageUsd: 0,
    overageMarkup: 0,
    canProvision: false,
  },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;

/**
 * Create a Stripe Checkout session for a plan upgrade
 */
export async function createCheckoutSession(
  customerId: string,
  customerEmail: string,
  plan: 'moltbot' | 'starter' | 'pro',
  stripeCustomerId?: string
): Promise<string> {
  // Create or get Stripe customer
  let stripeCustomer = stripeCustomerId;
  
  if (!stripeCustomer) {
    const customer = await stripe.customers.create({
      email: customerEmail,
      metadata: { customer_id: customerId },
    });
    stripeCustomer = customer.id;
  }

  // Build line items based on plan
  const lineItems: { price: string; quantity?: number }[] = [
    { price: PRICES[plan], quantity: 1 },
  ];

  // Only add metered billing for legacy plans that use the managed proxy
  if ((plan === 'starter' || plan === 'pro') && PRICES.metered) {
    lineItems.push({ price: PRICES.metered });
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomer,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
    subscription_data: {
      metadata: {
        plan,
        customer_id: customerId,
      },
    },
    metadata: {
      plan,
      customer_id: customerId,
    },
  });

  return session.url!;
}

/**
 * Create a Stripe Billing Portal session
 */
export async function createPortalSession(stripeCustomerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return session.url;
}

/**
 * Report usage to Stripe for metered billing
 */
export async function reportUsage(
  subscriptionId: string,
  quantityCents: number
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const meteredItem = subscription.items.data.find(
    item => item.price.recurring?.usage_type === 'metered'
  );

  if (!meteredItem) {
    console.error('No metered price found on subscription');
    return;
  }

  // Use type assertion for Stripe SDK compatibility
  await (stripe.subscriptionItems as any).createUsageRecord(meteredItem.id, {
    quantity: quantityCents,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment',
  });
}
