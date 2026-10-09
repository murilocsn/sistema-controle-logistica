create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) >= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create table public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id),
  unique (user_id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  plate text not null check (plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  brand text not null check (length(trim(brand)) > 0),
  model text not null check (length(trim(model)) > 0),
  year integer check (year is null or (year between 1950 and 2100)),
  capacity_kg numeric(10, 2) check (capacity_kg is null or capacity_kg >= 0),
  odometer numeric(12, 2) not null default 0 check (odometer >= 0),
  status text not null default 'available' check (status in ('available', 'in_trip', 'maintenance', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, plate)
);

create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  cpf text not null check (cpf ~ '^[0-9]{11}$'),
  phone text,
  license_number text not null check (length(trim(license_number)) > 0),
  license_category text not null check (length(trim(license_category)) > 0),
  license_expires_at date not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, cpf),
  unique (company_id, license_number)
);

create trigger drivers_set_updated_at
before update on public.drivers
for each row execute function public.set_updated_at();

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  legal_name text not null check (length(trim(legal_name)) > 0),
  trade_name text,
  cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
  phone text,
  email text check (email is null or email = '' or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  address text,
  city text,
  state text check (state is null or state = '' or state ~ '^[A-Z]{2}$'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, cnpj)
);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create index company_users_user_id_idx on public.company_users(user_id);
create index company_users_company_id_idx on public.company_users(company_id);
create index vehicles_company_id_idx on public.vehicles(company_id);
create index drivers_company_id_idx on public.drivers(company_id);
create index customers_company_id_idx on public.customers(company_id);

alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.customers enable row level security;

revoke all on table public.companies from anon, authenticated;
revoke all on table public.company_users from anon, authenticated;
revoke all on table public.vehicles from anon, authenticated;
revoke all on table public.drivers from anon, authenticated;
revoke all on table public.customers from anon, authenticated;

grant select on table public.companies to authenticated;
grant select on table public.company_users to authenticated;
grant select, insert, update, delete on table public.vehicles to authenticated;
grant select, insert, update, delete on table public.drivers to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;

create policy "members can view their companies"
on public.companies for select
to authenticated
using (
  id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "users can view their own memberships"
on public.company_users for select
to authenticated
using (user_id = (select auth.uid()));

create policy "members can view vehicles"
on public.vehicles for select
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can create vehicles"
on public.vehicles for insert
to authenticated
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can update vehicles"
on public.vehicles for update
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
)
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can delete vehicles"
on public.vehicles for delete
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can view drivers"
on public.drivers for select
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can create drivers"
on public.drivers for insert
to authenticated
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can update drivers"
on public.drivers for update
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
)
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can delete drivers"
on public.drivers for delete
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can view customers"
on public.customers for select
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can create customers"
on public.customers for insert
to authenticated
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can update customers"
on public.customers for update
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
)
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can delete customers"
on public.customers for delete
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create or replace function public.create_company_for_current_user(company_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  existing_company_id uuid;
  new_company_id uuid;
  normalized_name text := nullif(trim(company_name), '');
begin
  if current_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if normalized_name is null or length(normalized_name) < 2 then
    raise exception 'invalid_company_name' using errcode = '22023';
  end if;

  select company_id
  into existing_company_id
  from public.company_users
  where user_id = current_user_id
  limit 1;

  if existing_company_id is not null then
    return existing_company_id;
  end if;

  insert into public.companies(name)
  values (normalized_name)
  returning id into new_company_id;

  insert into public.company_users(company_id, user_id, role)
  values (new_company_id, current_user_id, 'admin');

  return new_company_id;
end;
$$;

revoke all on function public.create_company_for_current_user(text) from public;
revoke all on function public.create_company_for_current_user(text) from anon;
grant execute on function public.create_company_for_current_user(text) to authenticated;
