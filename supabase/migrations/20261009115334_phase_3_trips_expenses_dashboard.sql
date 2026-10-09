alter table public.vehicles
  add constraint vehicles_company_id_id_key unique (company_id, id);

alter table public.drivers
  add constraint drivers_company_id_id_key unique (company_id, id);

alter table public.customers
  add constraint customers_company_id_id_key unique (company_id, id);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  vehicle_id uuid not null,
  driver_id uuid not null,
  customer_id uuid not null,
  origin text not null check (length(trim(origin)) > 0),
  destination text not null check (length(trim(destination)) > 0),
  planned_departure_at timestamptz not null,
  actual_departure_at timestamptz,
  estimated_arrival_at timestamptz,
  actual_arrival_at timestamptz,
  freight_value numeric(12, 2) not null default 0 check (freight_value >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'loading', 'in_transit', 'delivered', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, vehicle_id) references public.vehicles(company_id, id) on delete restrict,
  foreign key (company_id, driver_id) references public.drivers(company_id, id) on delete restrict,
  foreign key (company_id, customer_id) references public.customers(company_id, id) on delete restrict
);

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create table public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  trip_id uuid not null,
  expense_type text not null check (expense_type in ('fuel', 'toll', 'food', 'parking', 'maintenance', 'other')),
  description text not null check (length(trim(description)) > 0),
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (company_id, trip_id) references public.trips(company_id, id) on delete cascade
);

create trigger trip_expenses_set_updated_at
before update on public.trip_expenses
for each row execute function public.set_updated_at();

create table public.trip_status_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  trip_id uuid not null,
  previous_status text check (previous_status is null or previous_status in ('scheduled', 'loading', 'in_transit', 'delivered', 'completed', 'cancelled')),
  new_status text not null check (new_status in ('scheduled', 'loading', 'in_transit', 'delivered', 'completed', 'cancelled')),
  notes text,
  changed_at timestamptz not null default now(),
  foreign key (company_id, trip_id) references public.trips(company_id, id) on delete cascade
);

create or replace function public.record_trip_status_history()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.trip_status_history(company_id, trip_id, previous_status, new_status, notes)
    values (new.company_id, new.id, null, new.status, 'Status inicial');
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.trip_status_history(company_id, trip_id, previous_status, new_status, notes)
    values (new.company_id, new.id, old.status, new.status, null);
  end if;

  return new;
end;
$$;

create trigger trips_record_status_history
after insert or update of status on public.trips
for each row execute function public.record_trip_status_history();

create index trips_company_id_idx on public.trips(company_id);
create index trips_vehicle_id_idx on public.trips(vehicle_id);
create index trips_driver_id_idx on public.trips(driver_id);
create index trips_customer_id_idx on public.trips(customer_id);
create index trips_status_idx on public.trips(status);
create index trip_expenses_company_id_idx on public.trip_expenses(company_id);
create index trip_expenses_trip_id_idx on public.trip_expenses(trip_id);
create index trip_status_history_company_id_idx on public.trip_status_history(company_id);
create index trip_status_history_trip_id_idx on public.trip_status_history(trip_id);

alter table public.trips enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.trip_status_history enable row level security;

revoke all on table public.trips from anon, authenticated;
revoke all on table public.trip_expenses from anon, authenticated;
revoke all on table public.trip_status_history from anon, authenticated;

grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.trip_expenses to authenticated;
grant select, insert on table public.trip_status_history to authenticated;

revoke all on function public.record_trip_status_history() from public;
revoke all on function public.record_trip_status_history() from anon;
revoke all on function public.record_trip_status_history() from authenticated;

create policy "members can view trips"
on public.trips for select
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can create trips"
on public.trips for insert
to authenticated
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can update trips"
on public.trips for update
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

create policy "members can delete trips"
on public.trips for delete
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can view trip expenses"
on public.trip_expenses for select
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can create trip expenses"
on public.trip_expenses for insert
to authenticated
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can update trip expenses"
on public.trip_expenses for update
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

create policy "members can delete trip expenses"
on public.trip_expenses for delete
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can view trip status history"
on public.trip_status_history for select
to authenticated
using (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);

create policy "members can create trip status history"
on public.trip_status_history for insert
to authenticated
with check (
  company_id in (
    select company_id
    from public.company_users
    where user_id = (select auth.uid())
  )
);
