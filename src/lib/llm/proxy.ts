/**
 * LLM Proxy Service
 * 
 * @deprecated This proxy is deprecated in favor of BYOK (Bring Your Own Key).
 * Customers now provide their own Anthropic API keys during onboarding,
 * and their deployed servers use those keys directly.
 * This file is retained for reference and potential admin/internal use only.
 * 
 * Previously: Routes requests through our proxy, tracks usage, and bills customers.
 * Injects managed API keys - customers never see the actual keys.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAdminClient } from '@/lib/supabase/admin';
import { stripe, PLAN_CONFIG, reportUsage } from '@/lib/stripe';

// Lazy-initialized clients
let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return anthropicClient;
}

// LLM Pricing (USD per 1M tokens)
const LLM_PRICING: Record<string, { input: number; output: number; provider: string }> = {
  // Anthropic
  'claude-opus-4-20250514': { input: 15, output: 75, provider: 'anthropic' },
  'claude-sonnet-4-20250514': { input: 3, output: 15, provider: 'anthropic' },
  'claude-3-5-haiku-20241022': { input: 1, output: 5, provider: 'anthropic' },
  // OpenAI (for future use)
  'gpt-4o': { input: 2.5, output: 10, provider: 'openai' },
  'gpt-4o-mini': { input: 0.15, output: 0.6, provider: 'openai' },
  // Google (for future use)
  'gemini-1.5-pro': { input: 1.25, output: 5, provider: 'google' },
  'gemini-1.5-flash': { input: 0.075, output: 0.3, provider: 'google' },
};

type ModelId = keyof typeof LLM_PRICING;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  customerId: string;
  messages: ChatMessage[];
  model?: ModelId;
  maxTokens?: number;
  system?: string;
  channel?: string;
}

interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface UsageCheck {
  allowed: boolean;
  reason?: string;
  plan: string;
  trialEndsAt?: Date;
  monthlyUsageUsd: number;
}

/**
 * Calculate cost in USD for token usage
 */
function calculateCost(model: ModelId, inputTokens: number, outputTokens: number): number {
  const pricing = LLM_PRICING[model];
  if (!pricing) return 0;
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Check if customer can make requests
 */
async function checkCustomerAccess(customerId: string): Promise<UsageCheck> {
  const { data: customer } = await getAdminClient()
    .from('customers')
    .select('plan, trial_ends_at')
    .eq('id', customerId)
    .single();

  if (!customer) {
    return { allowed: false, reason: 'Customer not found', plan: 'none', monthlyUsageUsd: 0 };
  }

  // Get monthly usage
  const { data: monthlyUsage } = await getAdminClient()
    .rpc('get_monthly_usage', { p_customer_id: customerId });

  const monthlyUsageUsd = monthlyUsage || 0;

  // Check plan status
  switch (customer.plan) {
    case 'trial':
      const trialEnds = new Date(customer.trial_ends_at);
      if (trialEnds < new Date()) {
        return { 
          allowed: false, 
          reason: 'Trial expired', 
          plan: customer.plan, 
          trialEndsAt: trialEnds,
          monthlyUsageUsd 
        };
      }
      // Trial has $10 cap (N/A for BYOK — users pay Anthropic directly)
      // This cap only applies if requests are routed through the managed proxy.
      if (monthlyUsageUsd >= 10) {
        return { 
          allowed: false, 
          reason: 'Trial usage limit reached ($10)', 
          plan: customer.plan,
          monthlyUsageUsd 
        };
      }
      break;

    case 'cancelled':
      return { 
        allowed: false, 
        reason: 'Subscription cancelled', 
        plan: customer.plan,
        monthlyUsageUsd 
      };

    case 'starter':
    case 'pro':
      // Active plans - always allowed (they pay for usage)
      break;

    default:
      return { 
        allowed: false, 
        reason: 'Invalid plan', 
        plan: customer.plan,
        monthlyUsageUsd 
      };
  }

  return { allowed: true, plan: customer.plan, monthlyUsageUsd };
}

/**
 * Record usage and sync to Stripe
 */
async function recordUsage(
  customerId: string,
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
  channel?: string,
  requestId?: string
): Promise<void> {
  // Insert usage log
  await getAdminClient().from('usage_logs').insert({
    customer_id: customerId,
    provider,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd,
    channel,
    request_id: requestId,
  });

  // Aggregate daily usage
  await getAdminClient().rpc('aggregate_daily_usage', {
    p_customer_id: customerId,
    p_date: new Date().toISOString().split('T')[0],
  });

  // Report to Stripe for metered billing
  const { data: customer } = await getAdminClient()
    .from('customers')
    .select('plan, stripe_customer_id, subscription_id')
    .eq('id', customerId)
    .single();

  if (!customer?.stripe_customer_id || !customer.subscription_id) return;
  if (customer.plan === 'trial') return; // Don't bill trials

  try {
    const subscription = await stripe.subscriptions.retrieve(customer.subscription_id);
    const meteredItem = subscription.items.data.find(
      item => item.price.recurring?.usage_type === 'metered'
    );

    if (!meteredItem) return;

    // Calculate billable amount with markup
    const config = PLAN_CONFIG[customer.plan as keyof typeof PLAN_CONFIG];
    if (!config) return;

    let billableUsd = costUsd;
    
    // Pro tier: only bill overage above $75 included
    if (customer.plan === 'pro') {
      const { data: monthlyUsage } = await getAdminClient().rpc('get_monthly_usage', { 
        p_customer_id: customerId 
      });
      // If under included amount, don't bill this request
      if ((monthlyUsage || 0) <= config.includedUsageUsd) {
        return;
      }
    }

    // Apply markup
    const markedUpCents = Math.ceil(billableUsd * (1 + config.overageMarkup) * 100);

    await reportUsage(customer.subscription_id, markedUpCents);
  } catch (error) {
    console.error('Failed to report usage to Stripe:', error);
  }
}

/**
 * Main chat function - routes to Claude and tracks usage
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const {
    customerId,
    messages,
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4096,
    system,
    channel,
  } = request;

  // Check access
  const access = await checkCustomerAccess(customerId);
  if (!access.allowed) {
    throw new Error(`Access denied: ${access.reason}`);
  }

  const pricing = LLM_PRICING[model];
  if (!pricing) {
    throw new Error(`Unknown model: ${model}`);
  }

  // Route to appropriate provider
  let response;
  
  if (pricing.provider === 'anthropic') {
    response = await getAnthropic().messages.create({
      model,
      max_tokens: maxTokens,
      system: system || 'You are a helpful AI assistant.',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });
  } else {
    // TODO: Add OpenAI, Google, Groq support
    throw new Error(`Provider ${pricing.provider} not yet implemented`);
  }

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = calculateCost(model as ModelId, inputTokens, outputTokens);
  const content = response.content[0].type === 'text' ? response.content[0].text : '';

  // Record usage
  await recordUsage(
    customerId,
    pricing.provider,
    model,
    inputTokens,
    outputTokens,
    costUsd,
    channel,
    response.id
  );

  return {
    content,
    model,
    provider: pricing.provider,
    inputTokens,
    outputTokens,
    costUsd,
  };
}

export { checkCustomerAccess, calculateCost, LLM_PRICING };
export type { ChatRequest, ChatResponse, UsageCheck, ChatMessage };
