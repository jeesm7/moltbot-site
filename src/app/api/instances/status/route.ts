import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hetzner } from '@/lib/hetzner/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer's server (never select ssh_private_key — only load what we display)
    const { data: server } = await supabase
      .from('servers')
      .select('id, hetzner_server_id, name, status, ip_address, region, bot_display_name, channel_config_id')
      .eq('customer_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!server) {
      return NextResponse.json({
        status: 'none',
        message: 'No agent deployed',
      });
    }

    // Get current status from Hetzner
    try {
      const hetznerServer = await hetzner.getServer(server.hetzner_server_id);
      
      const status = hetznerServer.status === 'running' ? 'active' : 'provisioning';
      const ipAddress = hetznerServer.public_net.ipv4.ip;

      // Update if changed
      if (status !== server.status || ipAddress !== server.ip_address) {
        await supabase
          .from('servers')
          .update({ status, ip_address: ipAddress })
          .eq('id', server.id);
      }

      return NextResponse.json({
        id: server.id,
        hetznerServerId: server.hetzner_server_id,
        name: server.name,
        status,
        ipAddress,
        region: server.region,
        datacenter: hetznerServer.datacenter.name,
      });

    } catch (hetznerError) {
      console.error('Hetzner API error:', hetznerError);
      return NextResponse.json({
        id: server.id,
        hetznerServerId: server.hetzner_server_id,
        name: server.name,
        status: server.status,
        ipAddress: server.ip_address,
        region: server.region,
      });
    }

  } catch (error) {
    console.error('Server status error:', error);
    return NextResponse.json({ error: 'Failed to get server status' }, { status: 500 });
  }
}
