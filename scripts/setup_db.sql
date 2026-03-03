-- ============================================
-- MOLTBOT SAAS - DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing tables if they exist (for clean setup)
drop table if exists public.usage_daily cascade;
drop table if exists public.usage_logs cascade;
drop table if exists public.servers cascade;
drop table if exists public.customers cascade;

-- ============================================
-- TABLES
-- ============================================

-- Customers (extends Supabase auth.users)
create table public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  stripe_customer_id text unique,
  plan text default 'trial', -- trial, starter, pro, cancelled
  trial_ends_at timestamp,
  subscription_id text,
  current_period_end timestamp,
  created_at timestamp default now()
);

-- Servers
create table public.servers (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  hetzner_server_id text unique,
  name text,
  ip_address text,
  status text default 'provisioning', -- deploying, active, paused, deleted
  region text default 'fsn1',
  server_type text default 'cx22',
  gateway_token text,
  created_at timestamp default now(),
  deleted_at timestamp
);

-- Usage Logs (individual requests)
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  timestamp timestamp default now(),
  provider text not null, -- openai, anthropic, google, groq
  model text not null,
  input_tokens integer default 0,
  output_tokens integer default 0,
  cost_usd numeric(10,6) default 0,
  request_id text,
  channel text
);

-- Usage Daily (aggregated)
create table public.usage_daily (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  date date not null,
  total_requests integer default 0,
  total_input_tokens integer default 0,
  total_output_tokens integer default 0,
  total_cost_usd numeric(10,4) default 0,
  unique(customer_id, date)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.customers enable row level security;
alter table public.servers enable row level security;
alter table public.usage_logs enable row level security;
alter table public.usage_daily enable row level security;

-- Policies (customers can only see their own data)
create policy "Users can view own customer record" 
  on public.customers for select 
  using (auth.uid() = id);

create policy "Users can view own servers" 
  on public.servers for select 
  using (customer_id = auth.uid());

create policy "Users can view own usage" 
  on public.usage_logs for select 
  using (customer_id = auth.uid());

create policy "Users can view own daily usage" 
  on public.usage_daily for select 
  using (customer_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create customer record on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.customers (id, email, full_name, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    now() + interval '7 days'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- INDEXES
-- ============================================

create index if not exists idx_usage_logs_customer_timestamp 
  on public.usage_logs(customer_id, timestamp desc);

create index if not exists idx_usage_daily_customer_date 
  on public.usage_daily(customer_id, date desc);

create index if not exists idx_servers_customer 
  on public.servers(customer_id);

create index if not exists idx_servers_hetzner_id 
  on public.servers(hetzner_server_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Aggregate daily usage
create or replace function public.aggregate_daily_usage(p_customer_id uuid, p_date date)
returns void as $$
begin
  insert into public.usage_daily (customer_id, date, total_requests, total_input_tokens, total_output_tokens, total_cost_usd)
  select 
    p_customer_id,
    p_date,
    count(*),
    coalesce(sum(input_tokens), 0),
    coalesce(sum(output_tokens), 0),
    coalesce(sum(cost_usd), 0)
  from public.usage_logs
  where customer_id = p_customer_id
    and timestamp::date = p_date
  on conflict (customer_id, date) do update set
    total_requests = excluded.total_requests,
    total_input_tokens = excluded.total_input_tokens,
    total_output_tokens = excluded.total_output_tokens,
    total_cost_usd = excluded.total_cost_usd;
end;
$$ language plpgsql security definer;

-- Get customer's monthly usage
create or replace function public.get_monthly_usage(p_customer_id uuid)
returns numeric as $$
declare
  v_total numeric;
begin
  select coalesce(sum(total_cost_usd), 0)
  into v_total
  from public.usage_daily
  where customer_id = p_customer_id
    and date >= date_trunc('month', current_date);
  return v_total;
end;
$$ language plpgsql security definer;

-- ============================================
-- DONE
-- ============================================
select 'Database setup complete!' as status;
