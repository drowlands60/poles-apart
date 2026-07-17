-- Poles Apart - Runs (live round instances)
-- Runs are created from round templates and can be customised per instance

-- ============================================
-- RUNS (live instances of a round template)
-- ============================================
create table public.runs (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references public.rounds(id) on delete set null,
  name text not null, -- e.g. copied from template, can be overridden
  scheduled_date date not null,
  status text not null check (status in ('planned', 'in_progress', 'completed')) default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- RUN_CLEANERS (1-2 cleaners assigned per run)
-- ============================================
create table public.run_cleaners (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  cleaner_id uuid not null references public.profiles(id) on delete cascade,
  unique(run_id, cleaner_id)
);

-- ============================================
-- RUN_CUSTOMERS (customers on this specific run)
-- Copied from round template on creation, then customisable
-- ============================================
create table public.run_customers (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.runs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  position int not null default 0,
  price numeric(10,2) not null, -- snapshot at time of run creation
  status text not null check (status in ('pending', 'completed', 'skipped', 'cancelled')) default 'pending',
  notes text,
  completed_at timestamptz,
  unique(run_id, customer_id)
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_runs_round on public.runs(round_id);
create index idx_runs_date on public.runs(scheduled_date);
create index idx_runs_status on public.runs(status);
create index idx_run_cleaners_run on public.run_cleaners(run_id);
create index idx_run_cleaners_cleaner on public.run_cleaners(cleaner_id);
create index idx_run_customers_run on public.run_customers(run_id);
create index idx_run_customers_customer on public.run_customers(customer_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.runs enable row level security;
alter table public.run_cleaners enable row level security;
alter table public.run_customers enable row level security;

-- Runs: all authenticated can read, admins can modify
create policy "Runs are viewable by authenticated users"
  on public.runs for select
  to authenticated
  using (true);

create policy "Admins can insert runs"
  on public.runs for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update runs"
  on public.runs for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete runs"
  on public.runs for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Run cleaners: all authenticated can read, admins can modify
create policy "Run cleaners are viewable by authenticated users"
  on public.run_cleaners for select
  to authenticated
  using (true);

create policy "Admins can manage run cleaners"
  on public.run_cleaners for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Run customers: all authenticated can read, admins can modify
create policy "Run customers are viewable by authenticated users"
  on public.run_customers for select
  to authenticated
  using (true);

create policy "Admins can insert run customers"
  on public.run_customers for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update run customers"
  on public.run_customers for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Cleaners can update run customer status"
  on public.run_customers for update
  to authenticated
  using (
    exists (
      select 1 from public.run_cleaners rc
      where rc.run_id = run_customers.run_id
      and rc.cleaner_id = auth.uid()
    )
  );

create policy "Admins can delete run customers"
  on public.run_customers for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Updated_at trigger for runs
-- Ensure set_updated_at function exists (may already exist from migration 001)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_runs_updated_at
  before update on public.runs
  for each row execute function public.set_updated_at();
