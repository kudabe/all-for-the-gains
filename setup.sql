-- All For the Gains: one shared key-value table
create table if not exists kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table kv enable row level security;

create policy "public read"   on kv for select using (true);
create policy "public insert" on kv for insert with check (true);
create policy "public update" on kv for update using (true) with check (true);
create policy "public delete" on kv for delete using (true);
