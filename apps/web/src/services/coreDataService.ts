import { getSupabaseClient } from "../lib/supabase";
import {
  normalizePlate,
  normalizeState,
  onlyDigits,
  optionalText,
  parseOptionalInteger,
  parseOptionalNumber
} from "../lib/validators";
import type { Database } from "../types/supabase";

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripExpense = Database["public"]["Tables"]["trip_expenses"]["Row"];
export type TripStatusHistory = Database["public"]["Tables"]["trip_status_history"]["Row"];
export type VehicleStatus = Vehicle["status"];
export type TripStatus = Trip["status"];
export type ExpenseType = TripExpense["expense_type"];

export type VehicleFormValues = {
  plate: string;
  brand: string;
  model: string;
  year: string;
  capacityKg: string;
  odometer: string;
  status: VehicleStatus;
  notes: string;
};

export type DriverFormValues = {
  name: string;
  cpf: string;
  phone: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiresAt: string;
  active: boolean;
  notes: string;
};

export type CustomerFormValues = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes: string;
};

export type TripFormValues = {
  vehicleId: string;
  driverId: string;
  customerId: string;
  origin: string;
  destination: string;
  plannedDepartureAt: string;
  actualDepartureAt: string;
  estimatedArrivalAt: string;
  actualArrivalAt: string;
  freightValue: string;
  status: TripStatus;
  notes: string;
};

export type ExpenseFormValues = {
  tripId: string;
  expenseType: ExpenseType;
  description: string;
  amount: string;
  expenseDate: string;
  notes: string;
};

export type DashboardSummary = {
  totalVehicles: number;
  availableVehicles: number;
  vehiclesInTrip: number;
  vehiclesInMaintenance: number;
  tripsInProgress: number;
  completedTrips: number;
  periodRevenue: number;
  periodExpenses: number;
  periodResult: number;
  latestTrips: Trip[];
};

type DataError = {
  message: string;
};

function throwIfError(error: DataError | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function vehiclePayload(companyId: string, values: VehicleFormValues) {
  return {
    company_id: companyId,
    plate: normalizePlate(values.plate),
    brand: values.brand.trim(),
    model: values.model.trim(),
    year: parseOptionalInteger(values.year, "Ano"),
    capacity_kg: parseOptionalNumber(values.capacityKg, "Capacidade"),
    odometer: parseOptionalNumber(values.odometer, "Hodometro") ?? 0,
    status: values.status,
    notes: optionalText(values.notes)
  } satisfies Database["public"]["Tables"]["vehicles"]["Insert"];
}

function driverPayload(companyId: string, values: DriverFormValues) {
  return {
    company_id: companyId,
    name: values.name.trim(),
    cpf: onlyDigits(values.cpf),
    phone: optionalText(values.phone),
    license_number: values.licenseNumber.trim().toUpperCase(),
    license_category: values.licenseCategory.trim().toUpperCase(),
    license_expires_at: values.licenseExpiresAt,
    active: values.active,
    notes: optionalText(values.notes)
  } satisfies Database["public"]["Tables"]["drivers"]["Insert"];
}

function customerPayload(companyId: string, values: CustomerFormValues) {
  return {
    company_id: companyId,
    legal_name: values.legalName.trim(),
    trade_name: optionalText(values.tradeName),
    cnpj: onlyDigits(values.cnpj),
    phone: optionalText(values.phone),
    email: optionalText(values.email)?.toLowerCase() ?? null,
    address: optionalText(values.address),
    city: optionalText(values.city),
    state: optionalText(normalizeState(values.state)),
    notes: optionalText(values.notes)
  } satisfies Database["public"]["Tables"]["customers"]["Insert"];
}

function parseRequiredNumber(value: string, fieldLabel: string) {
  const parsed = parseOptionalNumber(value, fieldLabel);

  if (parsed === null) {
    throw new Error(`${fieldLabel} e obrigatorio.`);
  }

  return parsed;
}

function toIsoDateTime(value: string, fieldLabel: string) {
  if (!value.trim()) {
    throw new Error(`${fieldLabel} e obrigatorio.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldLabel} invalido.`);
  }

  return date.toISOString();
}

function optionalIsoDateTime(value: string, fieldLabel: string) {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldLabel} invalido.`);
  }

  return date.toISOString();
}

function tripPayload(companyId: string, values: TripFormValues) {
  return {
    company_id: companyId,
    vehicle_id: values.vehicleId,
    driver_id: values.driverId,
    customer_id: values.customerId,
    origin: values.origin.trim(),
    destination: values.destination.trim(),
    planned_departure_at: toIsoDateTime(values.plannedDepartureAt, "Saida prevista"),
    actual_departure_at: optionalIsoDateTime(values.actualDepartureAt, "Saida real"),
    estimated_arrival_at: optionalIsoDateTime(values.estimatedArrivalAt, "Chegada prevista"),
    actual_arrival_at: optionalIsoDateTime(values.actualArrivalAt, "Chegada real"),
    freight_value: parseOptionalNumber(values.freightValue, "Valor do frete") ?? 0,
    status: values.status,
    notes: optionalText(values.notes)
  } satisfies Database["public"]["Tables"]["trips"]["Insert"];
}

function expensePayload(companyId: string, values: ExpenseFormValues) {
  return {
    company_id: companyId,
    trip_id: values.tripId,
    expense_type: values.expenseType,
    description: values.description.trim(),
    amount: parseRequiredNumber(values.amount, "Valor"),
    expense_date: values.expenseDate,
    notes: optionalText(values.notes)
  } satisfies Database["public"]["Tables"]["trip_expenses"]["Insert"];
}

function isInCurrentMonth(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();

  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function sumNumbers(values: number[]) {
  return values.reduce((total, value) => total + Number(value), 0);
}

export async function listVehicles(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("vehicles")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createVehicle(companyId: string, values: VehicleFormValues) {
  const { error } = await getSupabaseClient().from("vehicles").insert(vehiclePayload(companyId, values));
  throwIfError(error);
}

export async function updateVehicle(companyId: string, id: string, values: VehicleFormValues) {
  const { company_id: _companyId, ...payload } = vehiclePayload(companyId, values);
  const { error } = await getSupabaseClient()
    .from("vehicles")
    .update(payload)
    .eq("id", id)
    .eq("company_id", companyId);

  throwIfError(error);
}

export async function deleteVehicle(companyId: string, id: string) {
  const { error } = await getSupabaseClient().from("vehicles").delete().eq("id", id).eq("company_id", companyId);
  throwIfError(error);
}

export async function listDrivers(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("drivers")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createDriver(companyId: string, values: DriverFormValues) {
  const { error } = await getSupabaseClient().from("drivers").insert(driverPayload(companyId, values));
  throwIfError(error);
}

export async function updateDriver(companyId: string, id: string, values: DriverFormValues) {
  const { company_id: _companyId, ...payload } = driverPayload(companyId, values);
  const { error } = await getSupabaseClient()
    .from("drivers")
    .update(payload)
    .eq("id", id)
    .eq("company_id", companyId);

  throwIfError(error);
}

export async function deleteDriver(companyId: string, id: string) {
  const { error } = await getSupabaseClient().from("drivers").delete().eq("id", id).eq("company_id", companyId);
  throwIfError(error);
}

export async function listCustomers(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("customers")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createCustomer(companyId: string, values: CustomerFormValues) {
  const { error } = await getSupabaseClient().from("customers").insert(customerPayload(companyId, values));
  throwIfError(error);
}

export async function updateCustomer(companyId: string, id: string, values: CustomerFormValues) {
  const { company_id: _companyId, ...payload } = customerPayload(companyId, values);
  const { error } = await getSupabaseClient()
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("company_id", companyId);

  throwIfError(error);
}

export async function deleteCustomer(companyId: string, id: string) {
  const { error } = await getSupabaseClient().from("customers").delete().eq("id", id).eq("company_id", companyId);
  throwIfError(error);
}

export async function listTrips(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("trips")
    .select("*")
    .eq("company_id", companyId)
    .order("planned_departure_at", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createTrip(companyId: string, values: TripFormValues) {
  const { error } = await getSupabaseClient().from("trips").insert(tripPayload(companyId, values));
  throwIfError(error);
}

export async function updateTrip(companyId: string, id: string, values: TripFormValues) {
  const { company_id: _companyId, ...payload } = tripPayload(companyId, values);
  const { error } = await getSupabaseClient()
    .from("trips")
    .update(payload)
    .eq("id", id)
    .eq("company_id", companyId);

  throwIfError(error);
}

export async function deleteTrip(companyId: string, id: string) {
  const { error } = await getSupabaseClient().from("trips").delete().eq("id", id).eq("company_id", companyId);
  throwIfError(error);
}

export async function listTripExpenses(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("trip_expenses")
    .select("*")
    .eq("company_id", companyId)
    .order("expense_date", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createTripExpense(companyId: string, values: ExpenseFormValues) {
  const { error } = await getSupabaseClient().from("trip_expenses").insert(expensePayload(companyId, values));
  throwIfError(error);
}

export async function updateTripExpense(companyId: string, id: string, values: ExpenseFormValues) {
  const { company_id: _companyId, ...payload } = expensePayload(companyId, values);
  const { error } = await getSupabaseClient()
    .from("trip_expenses")
    .update(payload)
    .eq("id", id)
    .eq("company_id", companyId);

  throwIfError(error);
}

export async function deleteTripExpense(companyId: string, id: string) {
  const { error } = await getSupabaseClient().from("trip_expenses").delete().eq("id", id).eq("company_id", companyId);
  throwIfError(error);
}

export async function listTripStatusHistory(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("trip_status_history")
    .select("*")
    .eq("company_id", companyId)
    .order("changed_at", { ascending: false })
    .limit(20);

  throwIfError(error);
  return data ?? [];
}

export async function getDashboardSummary(companyId: string): Promise<DashboardSummary> {
  const [vehicles, trips, expenses] = await Promise.all([
    listVehicles(companyId),
    listTrips(companyId),
    listTripExpenses(companyId)
  ]);

  const periodTrips = trips.filter((trip) => trip.status !== "cancelled" && isInCurrentMonth(trip.planned_departure_at));
  const periodExpenses = expenses.filter((expense) => isInCurrentMonth(expense.expense_date));
  const periodRevenue = sumNumbers(periodTrips.map((trip) => trip.freight_value));
  const totalExpenses = sumNumbers(periodExpenses.map((expense) => expense.amount));

  return {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter((vehicle) => vehicle.status === "available").length,
    vehiclesInTrip: vehicles.filter((vehicle) => vehicle.status === "in_trip").length,
    vehiclesInMaintenance: vehicles.filter((vehicle) => vehicle.status === "maintenance").length,
    tripsInProgress: trips.filter((trip) => ["loading", "in_transit", "delivered"].includes(trip.status)).length,
    completedTrips: trips.filter((trip) => trip.status === "completed").length,
    periodRevenue,
    periodExpenses: totalExpenses,
    periodResult: periodRevenue - totalExpenses,
    latestTrips: trips.slice(0, 5)
  };
}
