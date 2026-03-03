import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body as { plan: 'moltbot' | 'starter' | 'pro' };

    if (!plan || !['moltbot', 'starter', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Get customer record
    const { data: customer } = await adminClient
      .from('customers')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create checkout session
    const url = await createCheckoutSession(
      user.id,
      customer.email,
      plan,
      customer.stripe_customer_id || undefined
    );

    // If we created a new Stripe customer, save the ID
    // (This will be done in the webhook when checkout completes)

    return NextResponse.json({ url });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
