-- ============================================
-- Migration 002: Channel Configs + Server Enhancements
-- Adds messaging channel configuration for deployed instances
-- ============================================

-- Channel Configurations (messaging platform setup)
create table public.channel_configs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade not null,
  platform text not null check (platform in ('telegram', 'discord', 'whatsapp')),
  config jsonb not null default '{}',
  -- For telegram: { "bot_token": "...", "bot_username": "..." }
  -- For discord: { "bot_token": "...", "app_id": "..." }
  -- For whatsapp: { "phone_number_id": "...", "access_token": "...", "business_id": "..." }
  display_name text, -- e.g. "@MyBotName" for telegram
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Add channel_config_id to servers so we know which channel was used for deployment
alter table public.servers
  add column if not exists channel_config_id uuid references public.channel_configs(id) on delete set null;

-- Add bot_username column to servers for quick display
alter table public.servers
  add column if not exists bot_display_name text;

-- ============================================
-- Row Level Security
-- ============================================

alter table public.channel_configs enable row level security;

-- Users can only see their own channel configs
create policy "Users can view own channel configs"
  on public.channel_configs for select
  using (auth.uid() = customer_id);

-- Users can insert their own channel configs
create policy "Users can insert own channel configs"
  on public.channel_configs for insert
  with check (auth.uid() = customer_id);

-- Users can update their own channel configs
create policy "Users can update own channel configs"
  on public.channel_configs for update
  using (auth.uid() = customer_id);

-- Users can delete their own channel configs
create policy "Users can delete own channel configs"
  on public.channel_configs for delete
  using (auth.uid() = customer_id);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at for channel_configs
drop trigger if exists channel_configs_updated_at on public.channel_configs;
create trigger channel_configs_updated_at
  before update on public.channel_configs
  for each row
  execute function public.handle_updated_at();

-- ============================================
-- Indexes
-- ============================================

create index if not exists channel_configs_customer_id_idx
  on public.channel_configs(customer_id);

create index if not exists channel_configs_platform_idx
  on public.channel_configs(customer_id, platform);
