import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendTrialEndingSoonEmail, sendTrialEndedEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Verify authorization — ALWAYS require valid secret (no bypass if unset)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 32 || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminClient();

  const results = {
    reminders2Days: 0,
    expired: 0,
    errors: [] as string[],
  };

  try {
    const now = new Date();
    
    // ============================================
    // Send reminders for trials ending in 2 days
    // ============================================
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const { data: trialsSoon } = await supabase
      .from('customers')
      .select('id, email, trial_ends_at')
      .eq('plan', 'trial')
      .gte('trial_ends_at', oneDayFromNow.toISOString())
      .lte('trial_ends_at', twoDaysFromNow.toISOString());

    for (const customer of trialsSoon || []) {
      try {
        const daysLeft = Math.ceil(
          (new Date(customer.trial_ends_at!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        await sendTrialEndingSoonEmail(customer.email, daysLeft);
        results.reminders2Days++;
        console.log(`Sent trial reminder to ${customer.email} (${daysLeft} days left)`);
      } catch (err) {
        results.errors.push(`Failed to send reminder to ${customer.email}`);
      }
    }

    // ============================================
    // Handle expired trials
    // ============================================
    const { data: expiredTrials } = await supabase
      .from('customers')
      .select('id, email')
      .eq('plan', 'trial')
      .lt('trial_ends_at', now.toISOString());

    for (const customer of expiredTrials || []) {
      try {
        // Send trial ended email
        await sendTrialEndedEmail(customer.email);
        
        // Update plan to expired
        await supabase
          .from('customers')
          .update({ plan: 'trial_expired' })
          .eq('id', customer.id);

        // Pause customer's server
        await supabase
          .from('servers')
          .update({ status: 'paused' })
          .eq('customer_id', customer.id)
          .is('deleted_at', null);

        results.expired++;
        console.log(`Trial expired for ${customer.email}`);
      } catch (err) {
        results.errors.push(`Failed to handle expired trial for ${customer.email}`);
      }
    }

    console.log(`Trial cron complete:`, results);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('Trial cron error:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
