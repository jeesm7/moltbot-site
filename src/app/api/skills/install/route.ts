import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { skills } from '@/data/skills';
import { Client as SSHClient } from 'ssh2';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Skill slug is required' }, { status: 400 });
    }

    // Look up skill in registry
    const skill = skills.find((s) => s.slug === slug);
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Get user's active server with SSH key
    const { data: server } = await supabase
      .from('servers')
      .select('id, ip_address, ssh_private_key, status')
      .eq('customer_id', user.id)
      .is('deleted_at', null)
      .single();

    if (!server) {
      return NextResponse.json(
        { error: 'You need to deploy your bot first' },
        { status: 400 }
      );
    }

    if (server.status !== 'active') {
      return NextResponse.json(
        { error: 'Your server is still deploying. Please wait until it is active.' },
        { status: 400 }
      );
    }

    if (!server.ip_address || !server.ssh_private_key) {
      return NextResponse.json(
        { error: 'Server is not ready for skill installation. Missing connection details.' },
        { status: 400 }
      );
    }

    // Check if skill is already installed
    const { data: existingSkill } = await supabase
      .from('installed_skills')
      .select('id')
      .eq('server_id', server.id)
      .eq('skill_slug', slug)
      .single();

    if (existingSkill) {
      return NextResponse.json(
        { error: 'Skill is already installed' },
        { status: 409 }
      );
    }

    // SSH into the server and install the skill
    try {
      await executeSSHCommands(server.ip_address, server.ssh_private_key, skill.name, slug);
    } catch (sshError) {
      console.error('SSH installation failed:', sshError);
      return NextResponse.json(
        { error: 'Failed to install skill on server. Please try again.' },
        { status: 500 }
      );
    }

    // Record the installation in the database
    const { error: insertError } = await supabase
      .from('installed_skills')
      .insert({
        server_id: server.id,
        skill_slug: slug,
        status: 'installed',
      });

    if (insertError) {
      console.error('Failed to record skill installation:', insertError);
      return NextResponse.json(
        { error: 'Skill installed on server but failed to record. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      message: `${skill.name} installed successfully`,
    });
  } catch (error) {
    console.error('Skill install error:', error);
    return NextResponse.json(
      { error: 'Failed to install skill' },
      { status: 500 }
    );
  }
}

/**
 * Execute skill installation commands on the remote server via SSH.
 * For MVP, creates a skill directory with a placeholder SKILL.md.
 */
/**
 * Sanitize a string for safe use in shell commands.
 * Only allows alphanumeric, hyphens, and underscores.
 */
function sanitizeForShell(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '');
}

function executeSSHCommands(
  host: string,
  privateKey: string,
  skillName: string,
  slug: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new SSHClient();
    const timeout = setTimeout(() => {
      conn.end();
      reject(new Error('SSH connection timed out'));
    }, 30000);

    // Sanitize all user-influenced values before shell injection
    const safeSlug = sanitizeForShell(slug);
    const safeName = skillName.replace(/['"\\`$]/g, '');

    if (!safeSlug || safeSlug !== slug) {
      reject(new Error(`Invalid skill slug: ${slug}`));
      return;
    }

    conn.on('ready', () => {
      // MVP: Create skill directory with placeholder SKILL.md
      // Real downloads from clawdhub/GitHub will be wired up later
      const commands = [
        `mkdir -p /home/moltbot/clawd/skills/${safeSlug}`,
        `cat > /home/moltbot/clawd/skills/${safeSlug}/SKILL.md << 'SKILL_EOF'\n# ${safeName}\n\nSkill installed via MoltBot SaaS marketplace.\n\n## Status\nInstalled and ready to use.\nSKILL_EOF`,
        `chown -R moltbot:moltbot /home/moltbot/clawd/skills/${safeSlug}`,
      ].join(' && ');

      conn.exec(commands, (err, stream) => {
        if (err) {
          clearTimeout(timeout);
          conn.end();
          reject(err);
          return;
        }

        let stderr = '';
        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        stream.on('close', (code: number) => {
          clearTimeout(timeout);
          conn.end();
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`SSH command exited with code ${code}: ${stderr}`));
          }
        });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    conn.connect({
      host,
      port: 22,
      username: 'moltbot',
      privateKey,
    });
  });
}
