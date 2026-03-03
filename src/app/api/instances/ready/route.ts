import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendServerReadyEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify callback secret - deployed servers must include this
    const authHeader = request.headers.get('authorization');
    const callbackSecret = process.env.PROVISION_CALLBACK_SECRET;
    if (!callbackSecret || authHeader !== `Bearer ${callbackSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customer_id, ip_address, bot_display_name, ssh_private_key } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Get the server for this customer
    const { data: server } = await supabase
      .from('servers')
      .select('id, bot_display_name')
      .eq('customer_id', customer_id)
      .is('deleted_at', null)
      .single();

    if (!server) {
      return NextResponse.json({ error: 'Server not found' }, { status: 404 });
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: 'active',
      ip_address: ip_address || null,
    };

    // Update bot_display_name if provided and not already set
    if (bot_display_name && !server.bot_display_name) {
      updatePayload.bot_display_name = bot_display_name;
    }

    // Store SSH private key for remote skill management
    if (ssh_private_key) {
      updatePayload.ssh_private_key = ssh_private_key;
    }

    // Update server status to active
    await supabase
      .from('servers')
      .update(updatePayload)
      .eq('id', server.id);

    console.log(`Server ready for customer ${customer_id} at ${ip_address}`);

    // Send server ready email
    const { data: customer } = await supabase
      .from('customers')
      .select('email')
      .eq('id', customer_id)
      .single();

    if (customer && ip_address) {
      await sendServerReadyEmail(customer.email, ip_address);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server ready callback error:', error);
    return NextResponse.json({ error: 'Failed to mark server ready' }, { status: 500 });
  }
}
