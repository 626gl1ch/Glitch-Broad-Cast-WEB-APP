-- Supabase Schema Migration: Campaigns

create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text not null, -- The massive text input
  platforms text[] default '{}',
  tone text default 'Professional',
  schedule_type text default 'daily', -- daily, weekly, custom
  variants_per_cycle int default 1,
  status text default 'active', -- active, paused, finished
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add campaign_id to posts so we can track which posts belong to which campaign
alter table posts add column if not exists campaign_id uuid references campaigns(id) on delete cascade;

-- Enable RLS
alter table campaigns enable row level security;
create policy "Users manage own campaigns" on campaigns using (auth.uid() = user_id);
create policy "Admins see all campaigns" on campaigns for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Performance Indexes
create index if not exists idx_campaigns_user_id on campaigns(user_id);
create index if not exists idx_posts_campaign_id on posts(campaign_id);
