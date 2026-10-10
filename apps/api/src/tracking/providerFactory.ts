import { env } from "../config/env.js";
import { MockTrackingProvider } from "./providers/MockTrackingProvider.js";
import { PositronProvider } from "./providers/PositronProvider.js";
import { SascarProvider } from "./providers/SascarProvider.js";
import type { TrackingProvider, TrackingProviderCode, TrackingRuntimeStatus } from "./types.js";

const requiredSecrets: Record<TrackingProviderCode, string[]> = {
  mock: [],
  positron: ["POSITRON_API_URL", "POSITRON_USERNAME", "POSITRON_PASSWORD"],
  sascar: ["SASCAR_API_URL", "SASCAR_USERNAME", "SASCAR_PASSWORD"]
};

export function createTrackingProvider(code: TrackingProviderCode): TrackingProvider {
  if (code === "mock") {
    return new MockTrackingProvider();
  }

  if (code === "positron") {
    return new PositronProvider(env.tracking.positron);
  }

  return new SascarProvider(env.tracking.sascar);
}

export function listTrackingProviderRuntimeStatus(): TrackingRuntimeStatus[] {
  const codes: TrackingProviderCode[] = ["mock", "positron", "sascar"];

  return codes.map((code) => {
    const provider = createTrackingProvider(code);

    return {
      code,
      name: provider.name,
      configured: provider.isConfigured(),
      requiredSecrets: requiredSecrets[code]
    };
  });
}
