import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/channels - List the current user's channel configurations
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: channels, error } = await supabase
      .from('channel_configs')
      .select('id, platform, display_name, is_active, created_at, updated_at')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch channels:', error);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    return NextResponse.json({ channels: channels || [] });
  } catch (error) {
    console.error('Channels GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/channels - Create a new channel configuration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, config, display_name } = body;

    // Validate platform
    const validPlatforms = ['telegram', 'discord', 'whatsapp'];
    if (!platform || !validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Validate required config fields per platform
    const validationError = validateChannelConfig(platform, config);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Check if user already has a config for this platform
    const { data: existing } = await supabase
      .from('channel_configs')
      .select('id')
      .eq('customer_id', user.id)
      .eq('platform', platform)
      .single();

    if (existing) {
      // Update existing config
      const { data: updated, error: updateError } = await supabase
        .from('channel_configs')
        .update({
          config,
          display_name: display_name || null,
          is_active: true,
        })
        .eq('id', existing.id)
        .select('id, platform, display_name, is_active, created_at, updated_at')
        .single();

      if (updateError) {
        console.error('Failed to update channel:', updateError);
        return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
      }

      return NextResponse.json({ channel: updated, updated: true });
    }

    // Create new config
    const { data: channel, error: insertError } = await supabase
      .from('channel_configs')
      .insert({
        customer_id: user.id,
        platform,
        config,
        display_name: display_name || null,
      })
      .select('id, platform, display_name, is_active, created_at, updated_at')
      .single();

    if (insertError) {
      console.error('Failed to create channel:', insertError);
      return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
    }

    return NextResponse.json({ channel, created: true });
  } catch (error) {
    console.error('Channels POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE /api/channels - Delete a channel configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('id');

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
    }

    // Check if this channel is in use by an active server
    const { data: server } = await supabase
      .from('servers')
      .select('id')
      .eq('customer_id', user.id)
      .eq('channel_config_id', channelId)
      .is('deleted_at', null)
      .single();

    if (server) {
      return NextResponse.json(
        { error: 'Cannot delete a channel that is in use by an active server' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('channel_configs')
      .delete()
      .eq('id', channelId)
      .eq('customer_id', user.id);

    if (deleteError) {
      console.error('Failed to delete channel:', deleteError);
      return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Channels DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Validate channel config fields per platform.
 * Returns an error string if invalid, null if valid.
 */
function validateChannelConfig(platform: string, config: Record<string, string> | undefined): string | null {
  if (!config || typeof config !== 'object') {
    return 'Configuration is required';
  }

  switch (platform) {
    case 'telegram':
      if (!config.bot_token || typeof config.bot_token !== 'string') {
        return 'Telegram bot token is required';
      }
      // Basic token format validation: digits:alphanumeric
      if (!/^\d+:[A-Za-z0-9_-]+$/.test(config.bot_token.trim())) {
        return 'Invalid Telegram bot token format. It should look like: 123456789:ABCdefGHI...';
      }
      break;

    case 'discord':
      if (!config.bot_token || typeof config.bot_token !== 'string') {
        return 'Discord bot token is required';
      }
      if (!config.app_id || typeof config.app_id !== 'string') {
        return 'Discord Application ID is required';
      }
      break;

    case 'whatsapp':
      if (!config.phone_number_id || typeof config.phone_number_id !== 'string') {
        return 'WhatsApp Phone Number ID is required';
      }
      if (!config.access_token || typeof config.access_token !== 'string') {
        return 'WhatsApp Access Token is required';
      }
      break;

    default:
      return 'Unsupported platform';
  }

  return null;
}
