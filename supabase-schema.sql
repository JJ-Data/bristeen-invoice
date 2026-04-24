-- Run this in your Supabase SQL editor

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_price decimal(10,2) not null,
  unit text,
  created_at timestamptz default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  email text,
  address text,
  created_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  type text check (type in ('invoice', 'receipt')) not null,
  client_name text not null,
  client_phone text,
  client_email text,
  client_address text,
  date date not null default current_date,
  due_date date,
  notes text,
  subtotal decimal(10,2) not null default 0,
  vat_rate decimal(5,2) not null default 0,
  total decimal(10,2) not null default 0,
  status text default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  item_name text not null,
  quantity decimal(10,2) not null,
  unit_price decimal(10,2) not null,
  total decimal(10,2) not null
);

-- Row Level Security (only authenticated users can access data)
alter table items enable row level security;
alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "Authenticated users can manage items"
  on items for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage clients"
  on clients for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage invoices"
  on invoices for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage invoice_items"
  on invoice_items for all to authenticated using (true) with check (true);
