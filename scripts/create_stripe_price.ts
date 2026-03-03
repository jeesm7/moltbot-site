/**
 * Create the $19.97/month Moltbot plan in Stripe.
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/create_stripe_price.ts
 * 
 * After running, set STRIPE_PRICE_MOLTBOT in your environment to the output price ID.
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as Stripe.LatestApiVersion,
});

async function main() {
  // Create product
  const product = await stripe.products.create({
    name: 'Moltbot',
    description: 'Your own AI assistant. Dedicated cloud instance, all channels, unlimited usage.',
    metadata: { plan: 'moltbot' },
  });

  console.log(`✅ Product created: ${product.id}`);

  // Create $19.97/month recurring price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 1997, // $19.97 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: { plan: 'moltbot' },
  });

  console.log(`✅ Price created: ${price.id}`);
  console.log('');
  console.log('Add this to your environment variables:');
  console.log(`STRIPE_PRICE_MOLTBOT=${price.id}`);
}

main().catch(console.error);
