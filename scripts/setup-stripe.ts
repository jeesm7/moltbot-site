/**
 * Stripe Setup Script
 * 
 * Creates the required Stripe products and prices for Moltbot SaaS.
 * Run with: npx ts-node scripts/setup-stripe.ts
 * 
 * Requires STRIPE_SECRET_KEY environment variable.
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

async function setupStripe() {
  console.log('🚀 Setting up Stripe products and prices...\n');

  try {
    // Create Starter product
    console.log('Creating Starter product...');
    const starterProduct = await stripe.products.create({
      name: 'Moltbot Starter',
      description: 'Your own AI assistant - Pay as you go plan',
      metadata: {
        tier: 'starter',
        included_usage: '0',
        overage_markup: '0.20',
      },
    });
    console.log(`✅ Created product: ${starterProduct.id}`);

    // Create Starter price ($147/month)
    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 14700, // $147.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'starter',
      },
    });
    console.log(`✅ Created price: ${starterPrice.id} ($147/month)\n`);

    // Create Pro product
    console.log('Creating Pro product...');
    const proProduct = await stripe.products.create({
      name: 'Moltbot Pro',
      description: 'Your own AI assistant - $75 usage included',
      metadata: {
        tier: 'pro',
        included_usage: '7500', // $75.00 in cents
        overage_markup: '0.15',
      },
    });
    console.log(`✅ Created product: ${proProduct.id}`);

    // Create Pro price ($297/month)
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 29700, // $297.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier: 'pro',
      },
    });
    console.log(`✅ Created price: ${proPrice.id} ($297/month)\n`);

    // Create metered usage price for overage billing
    console.log('Creating metered usage price for overage...');
    const usagePrice = await stripe.prices.create({
      product: starterProduct.id, // Attach to starter but used by both
      unit_amount: 1, // $0.01 per unit (we'll report in cents)
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
      },
      metadata: {
        type: 'usage_overage',
      },
    });
    console.log(`✅ Created metered price: ${usagePrice.id}\n`);

    // Output configuration
    console.log('━'.repeat(50));
    console.log('Add these to your .env.local file:\n');
    console.log(`STRIPE_STARTER_PRICE_ID=${starterPrice.id}`);
    console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
    console.log(`STRIPE_USAGE_PRICE_ID=${usagePrice.id}`);
    console.log('━'.repeat(50));

    console.log('\n✨ Stripe setup complete!');

  } catch (error) {
    console.error('❌ Error setting up Stripe:', error);
    process.exit(1);
  }
}

setupStripe();
