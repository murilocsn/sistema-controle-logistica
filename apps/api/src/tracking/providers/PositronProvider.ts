import {
  TrackingProviderConfigurationError,
  TrackingProviderNotImplementedError,
  type TrackingPosition,
  type TrackingProvider,
  type TrackingProviderCode,
  type TrackingProviderCredentials,
  type TrackingVehicle
} from "../types.js";

export class PositronProvider implements TrackingProvider {
  readonly code: TrackingProviderCode = "positron";
  readonly name = "Positron";

  constructor(private readonly credentials: TrackingProviderCredentials) {}

  isConfigured() {
    return Boolean(this.credentials.apiUrl && this.credentials.username && this.credentials.password);
  }

  async authenticate() {
    this.assertConfigured();
  }

  async listVehicles(): Promise<TrackingVehicle[]> {
    this.assertConfigured();
    throw new TrackingProviderNotImplementedError(this.name);
  }

  async getLatestPositions(_externalIds: string[]): Promise<TrackingPosition[]> {
    this.assertConfigured();
    throw new TrackingProviderNotImplementedError(this.name);
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new TrackingProviderConfigurationError(this.name);
    }
  }
}
