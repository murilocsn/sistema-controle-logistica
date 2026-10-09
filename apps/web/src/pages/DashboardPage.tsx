import { useCallback, useEffect, useState } from "react";
import { useCompany } from "../company/useCompany";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import { getDashboardSummary, type DashboardSummary, type TripStatus } from "../services/coreDataService";

const tripStatusLabels: Record<TripStatus, string> = {
  scheduled: "Agendada",
  loading: "Carregando",
  in_transit: "Em transito",
  delivered: "Entregue",
  completed: "Concluida",
  cancelled: "Cancelada"
};

const emptySummary: DashboardSummary = {
  totalVehicles: 0,
  availableVehicles: 0,
  vehiclesInTrip: 0,
  vehiclesInMaintenance: 0,
  tripsInProgress: 0,
  completedTrips: 0,
  periodRevenue: 0,
  periodExpenses: 0,
  periodResult: 0,
  latestTrips: []
};

export function DashboardPage() {
  const { company } = useCompany();
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const companyId = company?.id ?? "";

  const loadDashboard = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setSummary(await getDashboardSummary(companyId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = [
    { label: "Total de veiculos", value: summary.totalVehicles.toString() },
    { label: "Veiculos disponiveis", value: summary.availableVehicles.toString() },
    { label: "Veiculos em viagem", value: summary.vehiclesInTrip.toString() },
    { label: "Veiculos em manutencao", value: summary.vehiclesInMaintenance.toString() },
    { label: "Viagens em andamento", value: summary.tripsInProgress.toString() },
    { label: "Viagens concluidas", value: summary.completedTrips.toString() },
    { label: "Faturamento do periodo", value: formatCurrency(summary.periodRevenue) },
    { label: "Despesas do periodo", value: formatCurrency(summary.periodExpenses) },
    { label: "Resultado financeiro", value: formatCurrency(summary.periodResult) }
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Resumo operacional</h1>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}
      {loading ? <LoadingState title="Carregando dashboard..." /> : null}

      {!loading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded border border-graphite-100 bg-white p-4 shadow-subtle">
                <p className="text-sm font-medium text-graphite-700">{metric.label}</p>
                <p className="mt-3 text-2xl font-semibold text-graphite-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded border border-graphite-100 bg-white shadow-subtle">
            <div className="border-b border-graphite-100 px-4 py-3">
              <h2 className="text-base font-semibold text-graphite-900">Ultimas viagens</h2>
            </div>

            {summary.latestTrips.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Sem viagens registradas" description="As proximas viagens cadastradas aparecem aqui." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-graphite-100 text-sm">
                  <thead className="bg-graphite-50 text-left text-graphite-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Rota</th>
                      <th className="px-4 py-3 font-semibold">Saida prevista</th>
                      <th className="px-4 py-3 font-semibold">Frete</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-graphite-100">
                    {summary.latestTrips.map((trip) => (
                      <tr key={trip.id}>
                        <td className="px-4 py-3 font-medium text-graphite-900">{trip.origin} &gt; {trip.destination}</td>
                        <td className="px-4 py-3 text-graphite-700">{formatDateTime(trip.planned_departure_at)}</td>
                        <td className="px-4 py-3 text-graphite-700">{formatCurrency(trip.freight_value)}</td>
                        <td className="px-4 py-3 text-graphite-700">{tripStatusLabels[trip.status]}</td>
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
