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
export type VehicleStatus = Vehicle["status"];

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
