import type { TrackingPosition, TrackingProvider, TrackingProviderCode, TrackingVehicle } from "../types.js";

export class MockTrackingProvider implements TrackingProvider {
  readonly code: TrackingProviderCode = "mock";
  readonly name = "Mock local";

  isConfigured() {
    return true;
  }

  async authenticate() {
    return Promise.resolve();
  }

  async listVehicles(): Promise<TrackingVehicle[]> {
    return [];
  }

  async getLatestPositions(_externalIds: string[]): Promise<TrackingPosition[]> {
    return [];
  }
}
