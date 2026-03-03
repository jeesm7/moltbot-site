import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hetzner } from '@/lib/hetzner/client';
import type { ChannelConfig } from '@/lib/hetzner/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if customer already has a server
    const { data: existingServer } = await supabase
      .from('servers')
      .select('id')
      .eq('customer_id', user.id)
      .is('deleted_at', null)
      .single();

    if (existingServer) {
      return NextResponse.json({ error: 'Customer already has an active server' }, { status: 400 });
    }

    // Check plan status
    const { data: customer } = await supabase
      .from('customers')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single();

    const validPlans = ['trial', 'moltbot', 'starter', 'pro'];
    if (!customer || !validPlans.includes(customer.plan || '')) {
      return NextResponse.json({ error: 'Active plan required' }, { status: 403 });
    }

    // Check trial expiry
    if (customer.plan === 'trial' && new Date(customer.trial_ends_at!) < new Date()) {
      return NextResponse.json({ error: 'Trial expired' }, { status: 403 });
    }

    // Parse request body - channel_config_id and anthropic_api_key are required
    let body: { channel_config_id?: string; anthropic_api_key?: string; openai_api_key?: string } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!body.channel_config_id) {
      return NextResponse.json(
        { error: 'A messaging channel must be configured before deploying' },
        { status: 400 }
      );
    }

    if (!body.anthropic_api_key) {
      return NextResponse.json(
        { error: 'An Anthropic API key is required to deploy your bot' },
        { status: 400 }
      );
    }

    // Fetch the channel config
    const { data: channelConfig, error: channelError } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('id', body.channel_config_id)
      .eq('customer_id', user.id)
      .single();

    if (channelError || !channelConfig) {
      return NextResponse.json({ error: 'Channel configuration not found' }, { status: 404 });
    }

    // Build the channel config for cloud-init
    const channel = buildChannelConfig(channelConfig);
    if (!channel) {
      return NextResponse.json({ error: 'Invalid channel configuration' }, { status: 400 });
    }

    // Generate unique server name
    const serverName = `${user.id.slice(0, 8)}-${Date.now().toString(36)}`;

    // Deploy server on Hetzner with customer's BYOK API keys
    const { server } = await hetzner.createServer(
      user.id,
      serverName,
      channel,
      body.anthropic_api_key,
      body.openai_api_key,
      'fsn1'
    );

    // Determine bot display name
    let botDisplayName: string | null = null;
    if (channelConfig.display_name) {
      botDisplayName = channelConfig.display_name;
    } else if (channelConfig.platform === 'telegram' && channelConfig.config?.bot_username) {
      botDisplayName = `@${channelConfig.config.bot_username}`;
    }

    // Create server record
    const { data: newServer, error: serverError } = await supabase
      .from('servers')
      .insert({
        customer_id: user.id,
        hetzner_server_id: server.id.toString(),
        name: server.name,
        status: 'provisioning',
        region: 'fsn1',
        server_type: server.server_type.name,
        channel_config_id: channelConfig.id,
        bot_display_name: botDisplayName,
      })
      .select()
      .single();

    if (serverError) {
      console.error('Failed to create server record:', serverError);
      // Clean up the Hetzner server if we can't create the DB record
      await hetzner.deleteServer(server.id.toString());
      throw serverError;
    }

    console.log(`Server deployed for ${user.id}: ${server.id}`);

    return NextResponse.json({
      success: true,
      server: {
        id: newServer.id,
        hetznerServerId: server.id.toString(),
        name: server.name,
        status: 'provisioning',
        botDisplayName,
      },
    });
  } catch (error) {
    console.error('Server deployment error:', error);
    return NextResponse.json({ error: 'Failed to deploy server' }, { status: 500 });
  }
}

/**
 * Transform a DB channel_config row into the typed ChannelConfig for cloud-init.
 */
function buildChannelConfig(row: {
  platform: string;
  config: Record<string, string>;
}): ChannelConfig | null {
  switch (row.platform) {
    case 'telegram':
      if (!row.config.bot_token) return null;
      return {
        platform: 'telegram',
        bot_token: row.config.bot_token,
        bot_username: row.config.bot_username,
      };

    case 'discord':
      if (!row.config.bot_token || !row.config.app_id) return null;
      return {
        platform: 'discord',
        bot_token: row.config.bot_token,
        app_id: row.config.app_id,
      };

    case 'whatsapp':
      if (!row.config.phone_number_id || !row.config.access_token) return null;
      return {
        platform: 'whatsapp',
        phone_number_id: row.config.phone_number_id,
        access_token: row.config.access_token,
        business_id: row.config.business_id,
      };

    default:
      return null;
  }
}
