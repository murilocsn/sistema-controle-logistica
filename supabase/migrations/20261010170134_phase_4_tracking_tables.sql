create table public.tracking_providers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  code text not null check (code in ('mock', 'positron', 'sascar')),
  active boolean not null default true,
  status text not null default 'not_configured' check (status in ('not_configured', 'mock_active', 'configured', 'error')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code),
  unique (company_id, id)
);

create trigger tracking_providers_set_updated_at
before update on public.tracking_providers
for each row execute function public.set_updated_at();

create table public.tracking_devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  vehicle_id uuid not null,
  provider_id uuid not null,
  external_id text not null check (length(trim(external_id)) > 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'offline')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, vehicle_id, provider_id),
  unique (company_id, id),
  foreign key (company_id, vehicle_id) references public.vehicles(company_id, id) on delete cascade,
  foreign key (company_id, provider_id) references public.tracking_providers(company_id, id) on delete cascade
);

create trigger tracking_devices_set_updated_at
before update on public.tracking_devices
for each row execute function public.set_updated_at();

create table public.tracking_positions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tracking_device_id uuid not null,
  vehicle_id uuid not null,
  latitude numeric(10, 7) not null check (latitude between -90 and 90),
  longitude numeric(10, 7) not null check (longitude between -180 and 180),
  speed numeric(8, 2) not null default 0 check (speed >= 0),
  ignition boolean not null default false,
  heading numeric(6, 2) check (heading is null or (heading >= 0 and heading < 360)),
  odometer numeric(12, 2) check (odometer is null or odometer >= 0),
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (company_id, tracking_device_id) references public.tracking_devices(company_id, id) on delete cascade,
  foreign key (company_id, vehicle_id) references public.vehicles(company_id, id) on delete cascade
);

create table public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tracking_device_id uuid not null,
  event_type text not null check (length(trim(event_type)) > 0),
  payload jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (company_id, tracking_device_id) references public.tracking_devices(company_id, id) on delete cascade
);

create table public.tracking_sync_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider_id uuid not null,
  status text not null check (status in ('running', 'success', 'error')),
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (company_id, provider_id) references public.tracking_providers(company_id, id) on delete cascade
);

create index tracking_providers_company_id_idx on public.tracking_providers(company_id);
create index tracking_devices_company_id_idx on public.tracking_devices(company_id);
create index tracking_devices_company_vehicle_id_idx on public.tracking_devices(company_id, vehicle_id);
create index tracking_devices_company_provider_id_idx on public.tracking_devices(company_id, provider_id);
create index tracking_positions_company_device_recorded_idx on public.tracking_positions(company_id, tracking_device_id, recorded_at desc);
create index tracking_positions_company_vehicle_recorded_idx on public.tracking_positions(company_id, vehicle_id, recorded_at desc);
create index tracking_events_company_device_recorded_idx on public.tracking_events(company_id, tracking_device_id, recorded_at desc);
create index tracking_sync_logs_company_provider_started_idx on public.tracking_sync_logs(company_id, provider_id, started_at desc);

alter table public.tracking_providers enable row level security;
alter table public.tracking_devices enable row level security;
alter table public.tracking_positions enable row level security;
alter table public.tracking_events enable row level security;
alter table public.tracking_sync_logs enable row level security;

revoke all on table public.tracking_providers from anon, authenticated;
revoke all on table public.tracking_devices from anon, authenticated;
revoke all on table public.tracking_positions from anon, authenticated;
revoke all on table public.tracking_events from anon, authenticated;
revoke all on table public.tracking_sync_logs from anon, authenticated;

grant select, insert, update, delete on table public.tracking_providers to authenticated;
grant select, insert, update, delete on table public.tracking_devices to authenticated;
grant select, insert, update, delete on table public.tracking_positions to authenticated;
grant select, insert, update, delete on table public.tracking_events to authenticated;
grant select, insert, update, delete on table public.tracking_sync_logs to authenticated;

create policy "members can view tracking providers" on public.tracking_providers for select to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can create tracking providers" on public.tracking_providers for insert to authenticated with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can update tracking providers" on public.tracking_providers for update to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid()))) with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can delete tracking providers" on public.tracking_providers for delete to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));

create policy "members can view tracking devices" on public.tracking_devices for select to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can create tracking devices" on public.tracking_devices for insert to authenticated with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can update tracking devices" on public.tracking_devices for update to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid()))) with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can delete tracking devices" on public.tracking_devices for delete to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));

create policy "members can view tracking positions" on public.tracking_positions for select to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can create tracking positions" on public.tracking_positions for insert to authenticated with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can update tracking positions" on public.tracking_positions for update to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid()))) with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can delete tracking positions" on public.tracking_positions for delete to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));

create policy "members can view tracking events" on public.tracking_events for select to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can create tracking events" on public.tracking_events for insert to authenticated with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can update tracking events" on public.tracking_events for update to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid()))) with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can delete tracking events" on public.tracking_events for delete to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));

create policy "members can view tracking sync logs" on public.tracking_sync_logs for select to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can create tracking sync logs" on public.tracking_sync_logs for insert to authenticated with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can update tracking sync logs" on public.tracking_sync_logs for update to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid()))) with check (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
create policy "members can delete tracking sync logs" on public.tracking_sync_logs for delete to authenticated using (company_id in (select company_id from public.company_users where user_id = (select auth.uid())));
