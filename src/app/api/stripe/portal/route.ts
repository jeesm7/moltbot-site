import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = getAdminClient();

    // Get customer's Stripe customer ID
    const { data: customer } = await adminClient
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
    }

    // Create portal session
    const url = await createPortalSession(customer.stripe_customer_id);

    return NextResponse.json({ url });

  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
