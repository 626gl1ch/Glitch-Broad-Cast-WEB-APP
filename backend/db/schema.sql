-- Glitch Broadcast — Supabase schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "uuid-ossp";

-- User profiles for RBAC and Subscription tracking
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text default 'user',             -- 'user' or 'admin'
  subscription_status text default 'inactive', -- 'active' or 'inactive'
  usage_count int default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Media & files in the Content Vault
create table if not exists content_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  folder text default 'general',
  file_url text,
  file_type text,          -- image, video, document
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

-- A single "idea" that gets rewritten per platform
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  base_content text not null,          -- the raw idea / source text
  status text default 'draft',         -- draft, scheduled, published, failed
  scheduled_for timestamptz,
  created_at timestamptz default now()
);

-- Per-platform generated variant of a post (Gemini output lives here)
create table if not exists post_variants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  platform text not null,              -- facebook_page, instagram, linkedin, facebook_group
  content text not null,
  hashtags text[] default '{}',
  media_ids uuid[] default '{}',
  target_group_name text,              -- only used for facebook_group (assisted posting)
  target_group_url text,
  location_tag text,
  publish_status text default 'pending', -- pending, posted, failed, needs_manual_review
  platform_post_id text,               -- id returned by the official API, if applicable
  error_message text,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Chat history with the AI assistant
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,        -- user, assistant
  content text not null,
  created_at timestamptz default now()
);

-- Assisted-posting queue for Facebook Groups (Puppeteer fallback)
create table if not exists assisted_posting_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  post_variant_id uuid references post_variants(id) on delete cascade,
  group_url text not null,
  status text default 'queued',  -- queued, in_progress, awaiting_manual_click, done, failed
  log text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_post_variants_post_id on post_variants(post_id);
create index if not exists idx_assisted_queue_status on assisted_posting_queue(status);

-- Performance Indexes
create index if not exists idx_content_items_user_id on content_items(user_id);
create index if not exists idx_posts_user_id on posts(user_id);
create index if not exists idx_post_variants_user_id on post_variants(user_id);
create index if not exists idx_chat_messages_user_id on chat_messages(user_id);
create index if not exists idx_assisted_posting_queue_user_id on assisted_posting_queue(user_id);

-- Enable RLS on all data tables
alter table content_items enable row level security;
alter table posts enable row level security;
alter table post_variants enable row level security;
alter table chat_messages enable row level security;
alter table assisted_posting_queue enable row level security;

-- Create policies for standard users (and admins implicitly since admins are users)
create policy "Users manage own content" on content_items using (auth.uid() = user_id);
create policy "Users manage own posts" on posts using (auth.uid() = user_id);
create policy "Users manage own variants" on post_variants using (auth.uid() = user_id);
create policy "Users manage own chat" on chat_messages using (auth.uid() = user_id);
create policy "Users manage own queue" on assisted_posting_queue using (auth.uid() = user_id);

-- Admin override policies (Admins bypass RLS using the same approach as profiles)
create policy "Admins see all content" on content_items for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins see all posts" on posts for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins see all variants" on post_variants for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins see all chat" on chat_messages for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins see all queue" on assisted_posting_queue for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

