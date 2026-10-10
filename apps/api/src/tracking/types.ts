export type TrackingProviderCode = "mock" | "positron" | "sascar";

export type TrackingProviderCredentials = {
  apiUrl: string;
  username: string;
  password: string;
};

export type TrackingVehicle = {
  externalId: string;
  plate: string;
  label: string;
};

export type TrackingPosition = {
  externalId: string;
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  heading: number | null;
  odometer: number | null;
  recordedAt: string;
};

export type TrackingRuntimeStatus = {
  code: TrackingProviderCode;
  name: string;
  configured: boolean;
  requiredSecrets: string[];
};

export interface TrackingProvider {
  readonly code: TrackingProviderCode;
  readonly name: string;
  isConfigured(): boolean;
  authenticate(): Promise<void>;
  listVehicles(): Promise<TrackingVehicle[]>;
  getLatestPositions(externalIds: string[]): Promise<TrackingPosition[]>;
}

export class TrackingProviderConfigurationError extends Error {
  constructor(providerName: string) {
    super(`Credenciais ausentes para ${providerName}.`);
    this.name = "TrackingProviderConfigurationError";
  }
}

export class TrackingProviderNotImplementedError extends Error {
  constructor(providerName: string) {
    super(`Integracao ${providerName} preparada, mas chamada real ainda nao implementada.`);
    this.name = "TrackingProviderNotImplementedError";
  }
}
