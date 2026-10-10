import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, RefreshCw, Satellite, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCompany } from "../company/useCompany";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { formatDateTime } from "../lib/formatters";
import {
  ensureDefaultTrackingProviders,
  listTrackingOverview,
  listTrackingProviders,
  listTrackingSyncLogs,
  syncMockTracking,
  type NormalizedTrackingPosition,
  type TrackingProvider,
  type TrackingStatus,
  type TrackingSyncLog
} from "../services/trackingService";

type StatusFilter = TrackingStatus | "all";

const statusLabels: Record<TrackingStatus, string> = {
  moving: "Em movimento",
  stopped: "Parado",
  offline: "Offline",
  in_trip: "Em viagem"
};

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "in_trip", label: "Em viagem" },
  { value: "moving", label: "Movimento" },
  { value: "stopped", label: "Parados" },
  { value: "offline", label: "Offline" }
];

function createPopupContent(item: NormalizedTrackingPosition) {
  const wrapper = document.createElement("div");
  wrapper.className = "fleet-popup";

  const title = document.createElement("strong");
  title.textContent = item.plate;

  const vehicle = document.createElement("span");
  vehicle.textContent = item.vehicleName;

  const status = document.createElement("span");
  status.textContent = `${statusLabels[item.status]} - ${Math.round(item.speed)} km/h`;

  const provider = document.createElement("span");
  provider.textContent = item.providerName;

  wrapper.append(title, vehicle, status, provider);
  return wrapper;
}

function countByStatus(items: NormalizedTrackingPosition[], status: TrackingStatus) {
  return items.filter((item) => item.status === status).length;
}

export function TrackingPage() {
  const { company } = useCompany();
  const [tracking, setTracking] = useState<NormalizedTrackingPosition[]>([]);
  const [providers, setProviders] = useState<TrackingProvider[]>([]);
  const [logs, setLogs] = useState<TrackingSyncLog[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const companyId = company?.id ?? "";

  const loadTracking = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await ensureDefaultTrackingProviders(companyId);
      const [providerRows, overviewRows, syncLogs] = await Promise.all([
        listTrackingProviders(companyId),
        listTrackingOverview(companyId),
        listTrackingSyncLogs(companyId)
      ]);

      setProviders(providerRows);
      setTracking(overviewRows);
      setLogs(syncLogs);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar rastreamento.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadTracking();
  }, [loadTracking]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([-23.5505, -46.6333], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markerLayerRef.current = markerLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  const filteredTracking = useMemo(() => {
    if (filter === "all") {
      return tracking;
    }

    return tracking.filter((item) => item.status === filter);
  }, [filter, tracking]);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;

    if (!map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    for (const item of filteredTracking) {
      if (item.latitude === null || item.longitude === null) {
        continue;
      }

      const coordinate: L.LatLngExpression = [item.latitude, item.longitude];
      bounds.push(coordinate);

      L.marker(coordinate, {
        icon: L.divIcon({
          className: "fleet-marker",
          html: `<span class="fleet-marker-dot fleet-marker-dot--${item.status}"></span>`,
          iconAnchor: [11, 11],
          iconSize: [22, 22]
        })
      })
        .bindPopup(createPopupContent(item))
        .addTo(markerLayer);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.25), { maxZoom: 12 });
    }
  }, [filteredTracking]);

  const metrics = [
    { label: "Veiculos monitorados", value: tracking.length.toString() },
    { label: "Em viagem", value: countByStatus(tracking, "in_trip").toString() },
    { label: "Em movimento", value: countByStatus(tracking, "moving").toString() },
    { label: "Offline", value: countByStatus(tracking, "offline").toString() }
  ];

  const mockProvider = providers.find((provider) => provider.code === "mock");

  const handleMockSync = async () => {
    if (!companyId) {
      return;
    }

    setSyncing(true);
    setError("");

    try {
      setTracking(await syncMockTracking(companyId));
      setProviders(await listTrackingProviders(companyId));
      setLogs(await listTrackingSyncLogs(companyId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel sincronizar o mock.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-signal-600">Rastreamento</p>
          <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Mapa operacional da frota</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border border-graphite-100 bg-white px-3 py-2 text-sm font-medium text-graphite-800 transition hover:border-signal-500 hover:text-signal-600"
            onClick={() => void loadTracking()}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button
            type="button"
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded bg-signal-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:bg-graphite-100 disabled:text-graphite-700"
            onClick={() => void handleMockSync()}
          >
            <Zap size={16} />
            {syncing ? "Sincronizando..." : "Sincronizar mock"}
          </button>
        </div>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}
      {loading ? <LoadingState title="Carregando rastreamento..." /> : null}

      {!loading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded border border-graphite-100 bg-white p-4 shadow-subtle">
                <p className="text-sm font-medium text-graphite-700">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold text-graphite-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="overflow-hidden rounded border border-graphite-100 bg-white shadow-subtle">
              <div className="flex flex-col gap-3 border-b border-graphite-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-graphite-900">
                  <MapPin size={17} />
                  Mapa
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={[
                        "rounded border px-3 py-1.5 text-xs font-semibold transition",
                        filter === item.value
                          ? "border-signal-500 bg-signal-500 text-white"
                          : "border-graphite-100 bg-white text-graphite-700 hover:border-signal-500 hover:text-signal-600"
                      ].join(" ")}
                      onClick={() => setFilter(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div ref={mapElementRef} className="h-[520px] min-h-[420px] w-full bg-graphite-100" />
            </section>

            <aside className="rounded border border-graphite-100 bg-white shadow-subtle">
              <div className="border-b border-graphite-100 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-graphite-900">
                  <Satellite size={17} />
                  Veiculos
                </div>
              </div>

              {filteredTracking.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="Sem posicoes no filtro"
                    description={mockProvider ? "Use a sincronizacao mock para gerar posicoes de teste." : "Configure um provider de rastreamento."}
                  />
                </div>
              ) : (
                <div className="max-h-[520px] divide-y divide-graphite-100 overflow-y-auto">
                  {filteredTracking.map((item) => (
                    <button
                      key={item.vehicleId}
                      type="button"
                      className="block w-full px-4 py-3 text-left transition hover:bg-graphite-50"
                      onClick={() => {
                        if (item.latitude !== null && item.longitude !== null) {
                          mapRef.current?.setView([item.latitude, item.longitude], 13, { animate: true });
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-graphite-900">{item.plate}</p>
                          <p className="truncate text-xs text-graphite-700">{item.vehicleName}</p>
                        </div>
                        <span className={`status-pill status-pill--${item.status}`}>{statusLabels[item.status]}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-graphite-700">
                        <span>{Math.round(item.speed)} km/h</span>
                        <span>{item.providerName}</span>
                        <span className="col-span-2 truncate">{item.driverName ?? "Sem motorista em viagem"}</span>
                        <span className="col-span-2 truncate">{formatDateTime(item.recordedAt)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>

          <section className="rounded border border-graphite-100 bg-white shadow-subtle">
            <div className="border-b border-graphite-100 px-4 py-3">
              <h2 className="text-base font-semibold text-graphite-900">Sincronizacoes recentes</h2>
            </div>
            {logs.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Sem sincronizacoes" description="O historico aparece depois do primeiro sync mock ou provider real." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-graphite-100 text-sm">
                  <thead className="bg-graphite-50 text-left text-graphite-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Inicio</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-graphite-100">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 text-graphite-700">{formatDateTime(log.started_at)}</td>
                        <td className="px-4 py-3 font-medium text-graphite-900">{log.status}</td>
                        <td className="px-4 py-3 text-graphite-700">{log.message ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
