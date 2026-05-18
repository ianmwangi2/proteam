-- Contact messages table
create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  name       text not null,
  email      text not null,
  phone      text,
  subject    text,
  service    text,   -- which service the enquiry relates to
  message    text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;

-- Only service role can read/write (via backend)
create policy "Service role full access" on public.contact_messages
  for all using (true) with check (true);
