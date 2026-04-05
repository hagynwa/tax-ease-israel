-- TaxEase History Table
-- Run this in the Supabase SQL Editor to create the tax_calculations table.

create table if not exists public.tax_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tax_year int not null,
  gross_income numeric not null,
  tax_paid numeric not null,
  anticipated_refund numeric not null,
  breakdown jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.tax_calculations enable row level security;

-- Policy: Users can only see and insert their own records
create policy "Users can view own calculations"
  on public.tax_calculations for select
  using (auth.uid() = user_id);

create policy "Users can insert own calculations"
  on public.tax_calculations for insert
  with check (auth.uid() = user_id);
