import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's server
    const { data: server } = await supabase
      .from('servers')
      .select('id')
      .eq('customer_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!server) {
      return NextResponse.json({ slugs: [] });
    }

    // Get installed skills for this server
    const { data: installedSkills, error } = await supabase
      .from('installed_skills')
      .select('skill_slug')
      .eq('server_id', server.id)
      .eq('status', 'installed');

    if (error) {
      console.error('Failed to fetch installed skills:', error);
      return NextResponse.json({ error: 'Failed to fetch installed skills' }, { status: 500 });
    }

    const slugs = (installedSkills || []).map((s) => s.skill_slug);

    return NextResponse.json({ slugs });
  } catch (error) {
    console.error('Installed skills error:', error);
    return NextResponse.json({ error: 'Failed to fetch installed skills' }, { status: 500 });
  }
}
