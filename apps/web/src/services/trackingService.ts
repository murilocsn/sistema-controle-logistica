import { env } from "../config/env";
import { getSupabaseClient } from "../lib/supabase";
import type { Database, TrackingDeviceStatus, TrackingProviderCode, TrackingProviderStatus } from "../types/supabase";

export type TrackingProvider = Database["public"]["Tables"]["tracking_providers"]["Row"];
export type TrackingDevice = Database["public"]["Tables"]["tracking_devices"]["Row"];
export type TrackingPosition = Database["public"]["Tables"]["tracking_positions"]["Row"];
export type TrackingSyncLog = Database["public"]["Tables"]["tracking_sync_logs"]["Row"];

export type TrackingStatus = "moving" | "stopped" | "offline" | "in_trip";

export type NormalizedTrackingPosition = {
  vehicleId: string;
  deviceId: string | null;
  providerId: string | null;
  providerCode: TrackingProviderCode | null;
  providerName: string;
  plate: string;
  vehicleName: string;
  driverName: string | null;
  tripRoute: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  ignition: boolean;
  heading: number | null;
  odometer: number | null;
  recordedAt: string | null;
  deviceStatus: TrackingDeviceStatus | null;
  status: TrackingStatus;
};

export type ProviderRuntimeStatus = {
  code: TrackingProviderCode;
  name: string;
  configured: boolean;
  requiredSecrets: string[];
};

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Driver = Database["public"]["Tables"]["drivers"]["Row"];
type Trip = Database["public"]["Tables"]["trips"]["Row"];
type DataError = {
  message: string;
};

const defaultProviders: Array<{
  code: TrackingProviderCode;
  name: string;
  active: boolean;
  status: TrackingProviderStatus;
  notes: string;
}> = [
  {
    code: "mock",
    name: "Mock local",
    active: true,
    status: "mock_active",
    notes: "Provider simulado para validar mapa, status e fluxo operacional."
  },
  {
    code: "positron",
    name: "Positron",
    active: false,
    status: "not_configured",
    notes: "Aguardando credenciais do rastreador no backend."
  },
  {
    code: "sascar",
    name: "Sascar",
    active: false,
    status: "not_configured",
    notes: "Aguardando credenciais do rastreador no backend."
  }
];

const routeAnchors = [
  { latitude: -23.5505, longitude: -46.6333 },
  { latitude: -23.1896, longitude: -46.8842 },
  { latitude: -22.9056, longitude: -47.0608 },
  { latitude: -23.9608, longitude: -46.3336 },
  { latitude: -23.5015, longitude: -47.4526 },
  { latitude: -23.4543, longitude: -46.5337 }
];

function throwIfError(error: DataError | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function numberValue(value: number | null | undefined, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function byCreatedProviderOrder(provider: TrackingProvider) {
  const index = defaultProviders.findIndex((item) => item.code === provider.code);
  return index === -1 ? defaultProviders.length : index;
}

function getProviderStatus(provider: TrackingProvider, active: boolean): TrackingProviderStatus {
  if (!active) {
    return "not_configured";
  }

  return provider.code === "mock" ? "mock_active" : "configured";
}

function getDeviceStatus(vehicle: Vehicle): TrackingDeviceStatus {
  if (vehicle.status === "inactive") {
    return "inactive";
  }

  if (vehicle.status === "maintenance") {
    return "offline";
  }

  return "active";
}

function getMockSpeed(vehicle: Vehicle, index: number) {
  if (vehicle.status === "inactive" || vehicle.status === "maintenance") {
    return 0;
  }

  if (vehicle.status === "in_trip") {
    return 58 + ((index * 11) % 26);
  }

  return index % 3 === 0 ? 0 : 18 + ((index * 7) % 32);
}

function getMockPosition(vehicle: Vehicle, index: number, deviceId: string, timestamp: Date) {
  const anchor = routeAnchors[index % routeAnchors.length];
  const minuteSeed = Math.floor(timestamp.getTime() / 60_000);
  const phase = ((minuteSeed + index * 19) % 360) * (Math.PI / 180);
  const speed = getMockSpeed(vehicle, index);
  const recordedAt = new Date(timestamp.getTime() - index * 120_000);

  return {
    company_id: vehicle.company_id,
    tracking_device_id: deviceId,
    vehicle_id: vehicle.id,
    latitude: Number((anchor.latitude + Math.sin(phase) * 0.075 + index * 0.006).toFixed(7)),
    longitude: Number((anchor.longitude + Math.cos(phase) * 0.075 - index * 0.006).toFixed(7)),
    speed,
    ignition: speed > 0,
    heading: Number(((phase * 180) / Math.PI).toFixed(2)),
    odometer: Number((numberValue(vehicle.odometer) + index * 37 + speed * 0.45).toFixed(2)),
    recorded_at: recordedAt.toISOString()
  } satisfies Database["public"]["Tables"]["tracking_positions"]["Insert"];
}

function buildExternalId(vehicle: Vehicle) {
  return `MOCK-${vehicle.plate.replace(/[^A-Z0-9]/gi, "").toUpperCase()}`;
}

function isActiveTrip(trip: Trip) {
  return ["loading", "in_transit", "delivered"].includes(trip.status);
}

function getOverviewStatus(vehicle: Vehicle, device: TrackingDevice | null, position: TrackingPosition | null, trip: Trip | null): TrackingStatus {
  if (!position || device?.status === "offline" || device?.status === "inactive") {
    return "offline";
  }

  if (trip || vehicle.status === "in_trip") {
    return "in_trip";
  }

  if (numberValue(position.speed) >= 5 && position.ignition) {
    return "moving";
  }

  return "stopped";
}

export async function listTrackingProviders(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("tracking_providers")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  throwIfError(error);
  return [...(data ?? [])].sort((left, right) => byCreatedProviderOrder(left) - byCreatedProviderOrder(right));
}

export async function ensureDefaultTrackingProviders(companyId: string) {
  const providers = await listTrackingProviders(companyId);
  const existingCodes = new Set(providers.map((provider) => provider.code));
  const missingProviders = defaultProviders.filter((provider) => !existingCodes.has(provider.code));

  if (missingProviders.length > 0) {
    const { error } = await getSupabaseClient().from("tracking_providers").insert(
      missingProviders.map((provider) => ({
        company_id: companyId,
        name: provider.name,
        code: provider.code,
        active: provider.active,
        status: provider.status,
        notes: provider.notes
      }))
    );

    throwIfError(error);
  }

  return listTrackingProviders(companyId);
}

export async function updateTrackingProviderActive(companyId: string, provider: TrackingProvider, active: boolean) {
  const { error } = await getSupabaseClient()
    .from("tracking_providers")
    .update({
      active,
      status: getProviderStatus(provider, active)
    })
    .eq("company_id", companyId)
    .eq("id", provider.id);

  throwIfError(error);
}

export async function listTrackingDevices(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("tracking_devices")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function listTrackingSyncLogs(companyId: string) {
  const { data, error } = await getSupabaseClient()
    .from("tracking_sync_logs")
    .select("*")
    .eq("company_id", companyId)
    .order("started_at", { ascending: false })
    .limit(8);

  throwIfError(error);
  return data ?? [];
}

export async function syncMockTracking(companyId: string) {
  const supabase = getSupabaseClient();
  const providers = await ensureDefaultTrackingProviders(companyId);
  const mockProvider = providers.find((provider) => provider.code === "mock");

  if (!mockProvider) {
    throw new Error("Provider mock nao encontrado.");
  }

  const startedAt = new Date();

  try {
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("company_id", companyId)
      .order("plate", { ascending: true });

    throwIfError(vehiclesError);

    if (!vehicles || vehicles.length === 0) {
      throw new Error("Cadastre ao menos um veiculo para gerar o rastreamento mock.");
    }

    if (!mockProvider.active) {
      await updateTrackingProviderActive(companyId, mockProvider, true);
    }

    const now = new Date();
    const devicePayloads = vehicles.map((vehicle) => ({
      company_id: companyId,
      vehicle_id: vehicle.id,
      provider_id: mockProvider.id,
      external_id: buildExternalId(vehicle),
      status: getDeviceStatus(vehicle),
      last_sync_at: now.toISOString()
    })) satisfies Database["public"]["Tables"]["tracking_devices"]["Insert"][];

    const { data: devices, error: devicesError } = await supabase
      .from("tracking_devices")
      .upsert(devicePayloads, { onConflict: "company_id,vehicle_id,provider_id" })
      .select("*");

    throwIfError(devicesError);

    const positions = (devices ?? []).map((device, index) => {
      const vehicle = vehicles.find((item) => item.id === device.vehicle_id) ?? vehicles[index];
      return getMockPosition(vehicle, index, device.id, now);
    });

    if (positions.length > 0) {
      const { error: positionsError } = await supabase.from("tracking_positions").insert(positions);
      throwIfError(positionsError);
    }

    const { error: logError } = await supabase.from("tracking_sync_logs").insert({
      company_id: companyId,
      provider_id: mockProvider.id,
      status: "success",
      message: `${positions.length} posicoes mock sincronizadas.`,
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString()
    });

    throwIfError(logError);
    return listTrackingOverview(companyId);
  } catch (caughtError) {
    await supabase.from("tracking_sync_logs").insert({
      company_id: companyId,
      provider_id: mockProvider.id,
      status: "error",
      message: caughtError instanceof Error ? caughtError.message : "Falha ao sincronizar mock.",
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString()
    });

    throw caughtError;
  }
}

export async function listTrackingOverview(companyId: string): Promise<NormalizedTrackingPosition[]> {
  const supabase = getSupabaseClient();
  const [vehiclesResult, driversResult, tripsResult, providersResult, devicesResult, positionsResult] = await Promise.all([
    supabase.from("vehicles").select("*").eq("company_id", companyId).order("plate", { ascending: true }),
    supabase.from("drivers").select("*").eq("company_id", companyId),
    supabase.from("trips").select("*").eq("company_id", companyId).order("planned_departure_at", { ascending: false }),
    supabase.from("tracking_providers").select("*").eq("company_id", companyId),
    supabase.from("tracking_devices").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }),
    supabase
      .from("tracking_positions")
      .select("*")
      .eq("company_id", companyId)
      .order("recorded_at", { ascending: false })
      .limit(500)
  ]);

  throwIfError(vehiclesResult.error);
  throwIfError(driversResult.error);
  throwIfError(tripsResult.error);
  throwIfError(providersResult.error);
  throwIfError(devicesResult.error);
  throwIfError(positionsResult.error);

  const driversById = new Map((driversResult.data ?? []).map((driver: Driver) => [driver.id, driver]));
  const providersById = new Map((providersResult.data ?? []).map((provider: TrackingProvider) => [provider.id, provider]));
  const latestPositionsByDeviceId = new Map<string, TrackingPosition>();
  const devicesByVehicleId = new Map<string, TrackingDevice>();
  const activeTripsByVehicleId = new Map<string, Trip>();

  for (const position of positionsResult.data ?? []) {
    if (!latestPositionsByDeviceId.has(position.tracking_device_id)) {
      latestPositionsByDeviceId.set(position.tracking_device_id, position);
    }
  }

  for (const device of devicesResult.data ?? []) {
    if (!devicesByVehicleId.has(device.vehicle_id)) {
      devicesByVehicleId.set(device.vehicle_id, device);
    }
  }

  for (const trip of tripsResult.data ?? []) {
    if (isActiveTrip(trip) && !activeTripsByVehicleId.has(trip.vehicle_id)) {
      activeTripsByVehicleId.set(trip.vehicle_id, trip);
    }
  }

  return (vehiclesResult.data ?? []).map((vehicle: Vehicle) => {
    const device = devicesByVehicleId.get(vehicle.id) ?? null;
    const position = device ? latestPositionsByDeviceId.get(device.id) ?? null : null;
    const provider = device ? providersById.get(device.provider_id) ?? null : null;
    const trip = activeTripsByVehicleId.get(vehicle.id) ?? null;
    const driver = trip ? driversById.get(trip.driver_id) ?? null : null;

    return {
      vehicleId: vehicle.id,
      deviceId: device?.id ?? null,
      providerId: provider?.id ?? null,
      providerCode: provider?.code ?? null,
      providerName: provider?.name ?? "Sem provider",
      plate: vehicle.plate,
      vehicleName: `${vehicle.brand} ${vehicle.model}`,
      driverName: driver?.name ?? null,
      tripRoute: trip ? `${trip.origin} > ${trip.destination}` : null,
      latitude: position?.latitude ?? null,
      longitude: position?.longitude ?? null,
      speed: numberValue(position?.speed),
      ignition: position?.ignition ?? false,
      heading: position?.heading ?? null,
      odometer: position?.odometer ?? null,
      recordedAt: position?.recorded_at ?? null,
      deviceStatus: device?.status ?? null,
      status: getOverviewStatus(vehicle, device, position, trip)
    };
  });
}

export async function getProviderRuntimeStatuses(): Promise<ProviderRuntimeStatus[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Sessao ausente.");
  }

  const response = await fetch(`${env.apiUrl}/api/tracking/providers/status`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar a API de integracoes.");
  }

  const payload = (await response.json()) as { providers?: ProviderRuntimeStatus[] };
  return payload.providers ?? [];
}
