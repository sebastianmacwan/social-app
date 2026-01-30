-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- RESET: Drop existing tables to ensure clean schema (CASCADE drops relations)
-- WARNING: This deletes all data. Remove these lines if you want to keep data.
DROP TABLE IF EXISTS public."LoginHistory" CASCADE;
DROP TABLE IF EXISTS public."Subscription" CASCADE;
DROP TABLE IF EXISTS public."OTP" CASCADE;
DROP TABLE IF EXISTS public."Like" CASCADE;
DROP TABLE IF EXISTS public."Comment" CASCADE;
DROP TABLE IF EXISTS public."Post" CASCADE;
DROP TABLE IF EXISTS public."Friend" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."Question" CASCADE;
DROP TABLE IF EXISTS public."Answer" CASCADE;

-- Users Table
create table public."User" (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique not null,
  password text not null,
  phone text unique,
  points int default 0,
  "preferredLanguage" text default 'en',
  subscription_plan text default 'FREE', -- FREE, BRONZE_100, BRONZE_300, GOLD
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- Friends Table
create table public."Friend" (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public."User"(id) on delete cascade,
  friend_id uuid references public."User"(id) on delete cascade,
  status text default 'PENDING', -- PENDING, ACCEPTED, REJECTED
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now(),
  unique(user_id, friend_id)
);

-- Posts Table
create table public."Post" (
  id uuid primary key default uuid_generate_v4(),
  content text, -- Use text for unlimited length
  media_url text, -- Use text for long URLs/Base64
  media_type text,
  user_id uuid references public."User"(id) on delete cascade,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- Comments Table
create table public."Comment" (
  id uuid primary key default uuid_generate_v4(),
  content text not null, -- Use text for unlimited length
  post_id uuid references public."Post"(id) on delete cascade,
  user_id uuid references public."User"(id) on delete cascade,
  "createdAt" timestamp with time zone default now()
);

-- Likes Table
create table public."Like" (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public."Post"(id) on delete cascade,
  user_id uuid references public."User"(id) on delete cascade,
  "createdAt" timestamp with time zone default now(),
  unique(post_id, user_id)
);

-- OTP Table
create table public."OTP" (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public."User"(id) on delete cascade,
  otp text not null,
  type text default 'login',
  lang text default 'en',
  expires_at timestamp with time zone not null,
  "createdAt" timestamp with time zone default now()
);

-- Subscriptions Table
create table public."Subscription" (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public."User"(id) on delete cascade,
  plan text not null,
  price float not null,
  "startDate" timestamp with time zone default now(),
  "endDate" timestamp with time zone not null,
  status text default 'ACTIVE',
  "paymentId" text,
  "createdAt" timestamp with time zone default now()
);

-- LoginHistory Table
create table public."LoginHistory" (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public."User"(id) on delete cascade,
  browser text,
  os text,
  "deviceType" text,
  "ipAddress" text,
  timestamp timestamp with time zone default now()
);

-- Enable Row Level Security (RLS) - Optional but recommended
alter table public."User" enable row level security;
alter table public."Friend" enable row level security;
alter table public."Post" enable row level security;
alter table public."Comment" enable row level security;
alter table public."Like" enable row level security;
alter table public."OTP" enable row level security;
alter table public."Subscription" enable row level security;
alter table public."LoginHistory" enable row level security;

-- Question Table
create table public."Question" (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  author_id uuid references public."User"(id) on delete cascade,
  upvotes int default 0,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- Answer Table
create table public."Answer" (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  question_id uuid references public."Question"(id) on delete cascade,
  author_id uuid references public."User"(id) on delete cascade,
  upvotes int default 0,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- Enable RLS for new tables
alter table public."Question" enable row level security;
alter table public."Answer" enable row level security;

-- Create policies (Open for development, restrict for production)
create policy "Public Access" on public."User" for all using (true);
create policy "Public Access" on public."Friend" for all using (true);
create policy "Public Access" on public."Post" for all using (true);
create policy "Public Access" on public."Comment" for all using (true);
create policy "Public Access" on public."Like" for all using (true);
create policy "Public Access" on public."OTP" for all using (true);
create policy "Public Access" on public."Subscription" for all using (true);
create policy "Public Access" on public."LoginHistory" for all using (true);
create policy "Public Access" on public."Question" for all using (true);
create policy "Public Access" on public."Answer" for all using (true);

