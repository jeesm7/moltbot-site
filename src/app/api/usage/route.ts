import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer info
    const { data: customer } = await supabase
      .from('customers')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get current month's daily aggregates
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: dailyUsage } = await supabase
      .from('usage_daily')
      .select('*')
      .eq('customer_id', user.id)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Calculate totals
    const totals = (dailyUsage || []).reduce((acc, day) => ({
      requests: acc.requests + (day.total_requests || 0),
      inputTokens: acc.inputTokens + (day.total_input_tokens || 0),
      outputTokens: acc.outputTokens + (day.total_output_tokens || 0),
      costUsd: acc.costUsd + parseFloat(day.total_cost_usd || '0'),
    }), { requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 });

    // Get recent logs for detail view
    const { data: recentLogs } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('customer_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50);

    // Breakdown by provider and model
    const byProvider: Record<string, { requests: number; cost: number }> = {};
    const byModel: Record<string, { requests: number; cost: number }> = {};

    for (const log of recentLogs || []) {
      // By provider
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = { requests: 0, cost: 0 };
      }
      byProvider[log.provider].requests++;
      byProvider[log.provider].cost += parseFloat(log.cost_usd || '0');

      // By model
      if (!byModel[log.model]) {
        byModel[log.model] = { requests: 0, cost: 0 };
      }
      byModel[log.model].requests++;
      byModel[log.model].cost += parseFloat(log.cost_usd || '0');
    }

    return NextResponse.json({
      customer: {
        plan: customer.plan,
        trialEndsAt: customer.trial_ends_at,
      },
      currentMonth: {
        totalRequests: totals.requests,
        totalInputTokens: totals.inputTokens,
        totalOutputTokens: totals.outputTokens,
        totalCostUsd: Math.round(totals.costUsd * 100) / 100,
      },
      breakdown: {
        byProvider,
        byModel,
      },
      dailyUsage: (dailyUsage || []).map(day => ({
        date: day.date,
        requests: day.total_requests,
        inputTokens: day.total_input_tokens,
        outputTokens: day.total_output_tokens,
        costUsd: parseFloat(day.total_cost_usd || '0'),
      })),
      recentRequests: (recentLogs || []).slice(0, 10).map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        provider: log.provider,
        model: log.model,
        inputTokens: log.input_tokens,
        outputTokens: log.output_tokens,
        costUsd: parseFloat(log.cost_usd || '0'),
        channel: log.channel,
      })),
    });

  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Failed to get usage data' }, { status: 500 });
  }
}
