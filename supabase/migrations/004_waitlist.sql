-- Waitlist email collection
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamp default now(),
  notes text,
  converted boolean default false
);

-- Allow anonymous inserts (public form), admin reads
alter table public.waitlist enable row level security;

-- Anyone can submit their email (anon key)
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

-- Only service role can read (admin dashboard)
-- No select policy = only service_role can query
