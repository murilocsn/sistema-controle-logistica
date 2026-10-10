import { RefreshCw, Satellite, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "../company/useCompany";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { formatDateTime } from "../lib/formatters";
import {
  ensureDefaultTrackingProviders,
  getProviderRuntimeStatuses,
  listTrackingProviders,
  updateTrackingProviderActive,
  type ProviderRuntimeStatus,
  type TrackingProvider
} from "../services/trackingService";
import type { TrackingProviderCode } from "../types/supabase";

const providerDescriptions: Record<TrackingProviderCode, string> = {
  mock: "Base simulada para validar a operacao sem contrato de rastreador.",
  positron: "Estrutura preparada para credenciais Positron no backend.",
  sascar: "Estrutura preparada para credenciais Sascar no backend."
};

const statusLabels: Record<TrackingProvider["status"], string> = {
  not_configured: "Nao configurado",
  mock_active: "Mock ativo",
  configured: "Configurado",
  error: "Erro"
};

function providerRuntimeText(provider: TrackingProvider, runtime: ProviderRuntimeStatus | undefined) {
  if (provider.code === "mock") {
    return "Disponivel";
  }

  if (!runtime) {
    return "API nao consultada";
  }

  return runtime.configured ? "Credenciais presentes" : "Credenciais pendentes";
}

export function IntegrationsPage() {
  const { company } = useCompany();
  const [providers, setProviders] = useState<TrackingProvider[]>([]);
  const [runtimeStatuses, setRuntimeStatuses] = useState<ProviderRuntimeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [runtimeError, setRuntimeError] = useState("");

  const companyId = company?.id ?? "";

  const runtimeByCode = useMemo(
    () => new Map(runtimeStatuses.map((status) => [status.code, status])),
    [runtimeStatuses]
  );

  const loadIntegrations = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");
    setRuntimeError("");

    try {
      await ensureDefaultTrackingProviders(companyId);
      setProviders(await listTrackingProviders(companyId));

      try {
        setRuntimeStatuses(await getProviderRuntimeStatuses());
      } catch (caughtError) {
        setRuntimeStatuses([]);
        setRuntimeError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel consultar a API.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar integracoes.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  const toggleProvider = async (provider: TrackingProvider) => {
    setSavingId(provider.id);
    setError("");

    try {
      await updateTrackingProviderActive(companyId, provider, !provider.active);
      setProviders(await listTrackingProviders(companyId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel atualizar provider.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-signal-600">Integracoes</p>
          <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Providers de rastreamento</h1>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded border border-graphite-100 bg-white px-3 py-2 text-sm font-medium text-graphite-800 transition hover:border-signal-500 hover:text-signal-600"
          onClick={() => void loadIntegrations()}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}
      {runtimeError ? <ErrorState title="API de integracoes" description={runtimeError} /> : null}
      {loading ? <LoadingState title="Carregando integracoes..." /> : null}

      {!loading && providers.length === 0 ? <EmptyState title="Sem providers" description="Os providers padrao serao criados automaticamente." /> : null}

      {!loading && providers.length > 0 ? (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            {providers.map((provider) => {
              const runtime = runtimeByCode.get(provider.code);
              const saving = savingId === provider.id;

              return (
                <section key={provider.id} className="rounded border border-graphite-100 bg-white p-4 shadow-subtle">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Satellite size={17} className="text-signal-600" />
                        <h2 className="truncate text-base font-semibold text-graphite-900">{provider.name}</h2>
                      </div>
                      <p className="mt-2 text-sm text-graphite-700">{providerDescriptions[provider.code]}</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-graphite-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-signal-500"
                        checked={provider.active}
                        disabled={saving}
                        onChange={() => void toggleProvider(provider)}
                      />
                      Ativo
                    </label>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3 border-t border-graphite-100 pt-3">
                      <span className="text-graphite-700">Banco</span>
                      <span className="font-medium text-graphite-900">{statusLabels[provider.status]}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-graphite-700">Credenciais</span>
                      <span className="font-medium text-graphite-900">{providerRuntimeText(provider, runtime)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-graphite-700">Atualizado</span>
                      <span className="font-medium text-graphite-900">{formatDateTime(provider.updated_at)}</span>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <section className="rounded border border-graphite-100 bg-white shadow-subtle">
            <div className="flex items-center gap-2 border-b border-graphite-100 px-4 py-3 text-base font-semibold text-graphite-900">
              <ShieldCheck size={18} />
              Variaveis de backend
            </div>
            <div className="grid gap-4 p-4 text-sm text-graphite-700 md:grid-cols-2">
              <div>
                <p className="font-semibold text-graphite-900">Positron</p>
                <p className="mt-2">POSITRON_API_URL, POSITRON_USERNAME, POSITRON_PASSWORD</p>
              </div>
              <div>
                <p className="font-semibold text-graphite-900">Sascar</p>
                <p className="mt-2">SASCAR_API_URL, SASCAR_USERNAME, SASCAR_PASSWORD</p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
