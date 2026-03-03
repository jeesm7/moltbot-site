-- Migration: Skill installation support
-- Adds SSH key storage and installed_skills tracking

-- 1. Add ssh_private_key column to servers table
ALTER TABLE servers ADD COLUMN IF NOT EXISTS ssh_private_key text;

-- 2. Create installed_skills table
CREATE TABLE IF NOT EXISTS installed_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  skill_slug text NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'installed',
  UNIQUE (server_id, skill_slug)
);

-- 3. RLS policies for installed_skills
ALTER TABLE installed_skills ENABLE ROW LEVEL SECURITY;

-- Users can only see installed skills on their own servers
CREATE POLICY "Users can view their own installed skills"
  ON installed_skills
  FOR SELECT
  USING (
    server_id IN (
      SELECT id FROM servers WHERE customer_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Users can insert installed skills on their own servers
CREATE POLICY "Users can install skills on their own servers"
  ON installed_skills
  FOR INSERT
  WITH CHECK (
    server_id IN (
      SELECT id FROM servers WHERE customer_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Users can update installed skills on their own servers
CREATE POLICY "Users can update their own installed skills"
  ON installed_skills
  FOR UPDATE
  USING (
    server_id IN (
      SELECT id FROM servers WHERE customer_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_installed_skills_server_id ON installed_skills(server_id);
CREATE INDEX IF NOT EXISTS idx_installed_skills_slug ON installed_skills(skill_slug);
