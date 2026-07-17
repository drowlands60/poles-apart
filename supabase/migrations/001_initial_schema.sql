-- Poles Apart - Window Cleaning Business Management
-- Initial database schema

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'cleaner')) default 'cleaner',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'cleaner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ROUNDS (groups of customers)
-- ============================================
create table public.rounds (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  day_of_week int check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  frequency_weeks int not null default 4, -- how often this round repeats (e.g. every 4 weeks)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- CUSTOMERS
-- ============================================
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references public.rounds(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text, -- for SMS notifications
  address_line1 text not null,
  address_line2 text,
  city text not null,
  postcode text not null,
  latitude double precision,
  longitude double precision,
  price numeric(10,2) not null default 0,
  notes text,
  position_in_round int, -- ordering within a round
  is_active boolean not null default true,
  sms_opt_in boolean not null default true, -- whether they want text notifications
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- JOBS (individual cleaning visits)
-- ============================================
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  round_id uuid references public.rounds(id) on delete set null,
  cleaner_id uuid references public.profiles(id) on delete set null,
  scheduled_date date not null,
  status text not null check (status in ('scheduled', 'completed', 'skipped', 'cancelled')) default 'scheduled',
  price numeric(10,2) not null, -- price at time of job (may differ from current customer price)
  notes text, -- cleaner can add notes
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- PAYMENTS
-- ============================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  amount numeric(10,2) not null,
  method text check (method in ('cash', 'bank_transfer', 'card', 'other')) default 'cash',
  notes text,
  payment_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============================================
-- SMS LOG (track sent messages)
-- ============================================
create table public.sms_log (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  message_type text not null check (message_type in ('day_before', 'completed', 'custom')),
  message_body text not null,
  phone_number text not null,
  status text not null check (status in ('sent', 'failed', 'pending')) default 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_customers_round on public.customers(round_id);
create index idx_customers_active on public.customers(is_active);
create index idx_jobs_customer on public.jobs(customer_id);
create index idx_jobs_date on public.jobs(scheduled_date);
create index idx_jobs_status on public.jobs(status);
create index idx_jobs_round_date on public.jobs(round_id, scheduled_date);
create index idx_payments_customer on public.payments(customer_id);
create index idx_sms_log_customer on public.sms_log(customer_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.rounds enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.payments enable row level security;
alter table public.sms_log enable row level security;

-- Profiles: users can read all profiles, only update their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Rounds: all authenticated users can read, only admins can modify
create policy "Rounds are viewable by authenticated users"
  on public.rounds for select
  to authenticated
  using (true);

create policy "Admins can insert rounds"
  on public.rounds for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update rounds"
  on public.rounds for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete rounds"
  on public.rounds for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Customers: all authenticated can read, only admins can modify
create policy "Customers are viewable by authenticated users"
  on public.customers for select
  to authenticated
  using (true);

create policy "Admins can insert customers"
  on public.customers for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update customers"
  on public.customers for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete customers"
  on public.customers for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Jobs: all authenticated can read, cleaners can update status/notes, admins can do everything
create policy "Jobs are viewable by authenticated users"
  on public.jobs for select
  to authenticated
  using (true);

create policy "Admins can insert jobs"
  on public.jobs for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Authenticated users can update jobs"
  on public.jobs for update
  to authenticated
  using (true);

create policy "Admins can delete jobs"
  on public.jobs for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Payments: all authenticated can read, only admins can modify
create policy "Payments are viewable by authenticated users"
  on public.payments for select
  to authenticated
  using (true);

create policy "Admins can insert payments"
  on public.payments for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update payments"
  on public.payments for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete payments"
  on public.payments for delete
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- SMS Log: all authenticated can read, system inserts (via service role)
create policy "SMS logs are viewable by authenticated users"
  on public.sms_log for select
  to authenticated
  using (true);

create policy "Service role can insert sms logs"
  on public.sms_log for insert
  to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger update_rounds_updated_at before update on public.rounds
  for each row execute function public.update_updated_at();
create trigger update_customers_updated_at before update on public.customers
  for each row execute function public.update_updated_at();
create trigger update_jobs_updated_at before update on public.jobs
  for each row execute function public.update_updated_at();

-- ============================================
-- TABLE GRANTS (required for RLS policies to work)
-- ============================================
grant usage on schema public to authenticated;
grant usage on schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
