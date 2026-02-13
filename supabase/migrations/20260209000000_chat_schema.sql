-- ============================================================
-- TradvisorAI Chat Schema
-- Stores chat sessions and messages with RLS protection
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
create table if not exists public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast user lookups
create index if not exists idx_chat_sessions_user_id 
  on public.chat_sessions(user_id);
create index if not exists idx_chat_sessions_updated_at 
  on public.chat_sessions(updated_at desc);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_chat_session_updated
  before update on public.chat_sessions
  for each row execute function public.handle_updated_at();

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  metadata jsonb default '{}',
  -- metadata can store: { plan: {...}, tool_calls: [...], sources: [...] }
  created_at timestamptz not null default now()
);

-- Index for fast message retrieval
create index if not exists idx_chat_messages_session_id 
  on public.chat_messages(session_id, created_at asc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Chat sessions: users can only access their own
create policy "Users can view own sessions"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own sessions"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

-- Chat messages: users can access messages in their sessions
create policy "Users can view messages in own sessions"
  on public.chat_messages for select
  using (
    session_id in (
      select id from public.chat_sessions where user_id = auth.uid()
    )
  );

create policy "Users can create messages in own sessions"
  on public.chat_messages for insert
  with check (
    session_id in (
      select id from public.chat_sessions where user_id = auth.uid()
    )
  );

-- Service role bypass for edge functions
create policy "Service role full access to sessions"
  on public.chat_sessions for all
  using (auth.role() = 'service_role');

create policy "Service role full access to messages"
  on public.chat_messages for all
  using (auth.role() = 'service_role');
