import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ── Rate limiter for key validation (prevent brute-force) ────────
const validateLimitMap = new Map<string, { count: number; resetAt: number }>();
const VALIDATE_WINDOW_MS = 60_000; // 1 minute
const VALIDATE_MAX = 10; // 10 attempts per minute per user

function isValidateRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = validateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    validateLimitMap.set(userId, { count: 1, resetAt: now + VALIDATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > VALIDATE_MAX;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (isValidateRateLimited(user.id)) {
      return NextResponse.json(
        { valid: false, error: 'Too many validation attempts. Please wait a minute.' },
        { status: 429 }
      );
    }

    const { apiKey, provider } = await request.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    if (provider !== 'anthropic') {
      return NextResponse.json({ valid: false, error: 'Only Anthropic is supported' }, { status: 400 });
    }

    // Validate the Anthropic API key by making a minimal API call
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      if (response.ok) {
        return NextResponse.json({ valid: true });
      }

      const errorData = await response.json();
      const errorMessage = errorData?.error?.message || 'Invalid API key';

      // Distinguish between auth errors and other errors
      if (response.status === 401) {
        return NextResponse.json({ valid: false, error: 'Invalid API key. Please check and try again.' });
      }
      if (response.status === 403) {
        return NextResponse.json({ valid: false, error: 'API key lacks permissions. Make sure billing is enabled.' });
      }

      return NextResponse.json({ valid: false, error: errorMessage });
    } catch (fetchError) {
      console.error('Anthropic API validation error:', fetchError);
      return NextResponse.json({ valid: false, error: 'Could not reach Anthropic API. Please try again.' });
    }
  } catch (error) {
    console.error('Validate key error:', error);
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
