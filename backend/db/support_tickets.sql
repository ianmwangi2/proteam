-- Support Tickets table
create table if not exists public.support_tickets (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  subject     text not null,
  description text not null,
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status      text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- RLS
alter table public.support_tickets enable row level security;

create policy "Users can view own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

create policy "Users can insert own tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

-- Index
create index if not exists idx_support_tickets_user on public.support_tickets(user_id);
create index if not exists idx_support_tickets_status on public.support_tickets(status);
