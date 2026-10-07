import { AlertCircle } from "lucide-react";

const pendingMetrics = [
  "Total de veiculos",
  "Veiculos disponiveis",
  "Veiculos em viagem",
  "Veiculos em manutencao",
  "Viagens em andamento",
  "Viagens concluidas",
  "Faturamento do periodo",
  "Despesas do periodo",
  "Resultado financeiro"
];

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Resumo operacional</h1>
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
          <div>
            <p className="font-medium">Dados operacionais pendentes</p>
            <p className="mt-1 text-sm">
              O dashboard sera conectado ao banco quando as tabelas de negocio forem criadas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pendingMetrics.map((metric) => (
          <div key={metric} className="rounded border border-graphite-100 bg-white p-4 shadow-subtle">
            <p className="text-sm font-medium text-graphite-700">{metric}</p>
            <p className="mt-3 text-sm text-graphite-700">Sem dados</p>
          </div>
        ))}
      </div>

      <section className="rounded border border-graphite-100 bg-white shadow-subtle">
        <div className="border-b border-graphite-100 px-4 py-3">
          <h2 className="text-base font-semibold text-graphite-900">Ultimas viagens</h2>
        </div>
        <div className="px-4 py-8 text-sm text-graphite-700">Sem viagens registradas.</div>
      </section>
    </section>
  );
}
