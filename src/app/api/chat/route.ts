import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chat, ChatMessage } from '@/lib/llm/proxy';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      messages, 
      model, 
      maxTokens, 
      system,
      channel = 'api'
    } = body as {
      messages: ChatMessage[];
      model?: string;
      maxTokens?: number;
      system?: string;
      channel?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    // Call LLM proxy
    const response = await chat({
      customerId: user.id,
      messages,
      model: model as any,
      maxTokens,
      system,
      channel,
    });

    return NextResponse.json({
      content: response.content,
      model: response.model,
      provider: response.provider,
      usage: {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        costUsd: response.costUsd,
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
