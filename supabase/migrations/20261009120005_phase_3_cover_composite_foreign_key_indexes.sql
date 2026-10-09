create index trips_company_vehicle_id_idx on public.trips(company_id, vehicle_id);
create index trips_company_driver_id_idx on public.trips(company_id, driver_id);
create index trips_company_customer_id_idx on public.trips(company_id, customer_id);
create index trip_expenses_company_trip_id_idx on public.trip_expenses(company_id, trip_id);
create index trip_status_history_company_trip_id_idx on public.trip_status_history(company_id, trip_id);
