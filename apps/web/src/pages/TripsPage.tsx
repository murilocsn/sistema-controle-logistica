import { Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "../company/useCompany";
import { FormField, inputClassName, textareaClassName } from "../components/FormField";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { formatCurrency, formatDateTime, toDateTimeLocalInput } from "../lib/formatters";
import {
  createTrip,
  deleteTrip,
  listCustomers,
  listDrivers,
  listTripStatusHistory,
  listTrips,
  listVehicles,
  updateTrip,
  type Customer,
  type Driver,
  type Trip,
  type TripFormValues,
  type TripStatus,
  type TripStatusHistory,
  type Vehicle
} from "../services/coreDataService";

const initialForm: TripFormValues = {
  vehicleId: "",
  driverId: "",
  customerId: "",
  origin: "",
  destination: "",
  plannedDepartureAt: "",
  actualDepartureAt: "",
  estimatedArrivalAt: "",
  actualArrivalAt: "",
  freightValue: "0",
  status: "scheduled",
  notes: ""
};

const tripStatusOptions: { value: TripStatus; label: string }[] = [
  { value: "scheduled", label: "Agendada" },
  { value: "loading", label: "Carregando" },
  { value: "in_transit", label: "Em transito" },
  { value: "delivered", label: "Entregue" },
  { value: "completed", label: "Concluida" },
  { value: "cancelled", label: "Cancelada" }
];

const tripStatusLabels = Object.fromEntries(tripStatusOptions.map((option) => [option.value, option.label])) as Record<
  TripStatus,
  string
>;

export function TripsPage() {
  const { company } = useCompany();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [history, setHistory] = useState<TripStatusHistory[]>([]);
  const [form, setForm] = useState<TripFormValues>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const companyId = company?.id ?? "";

  const vehicleById = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])), [vehicles]);
  const driverById = useMemo(() => new Map(drivers.map((driver) => [driver.id, driver])), [drivers]);
  const customerById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const tripById = useMemo(() => new Map(trips.map((trip) => [trip.id, trip])), [trips]);

  const loadData = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [loadedTrips, loadedVehicles, loadedDrivers, loadedCustomers, loadedHistory] = await Promise.all([
        listTrips(companyId),
        listVehicles(companyId),
        listDrivers(companyId),
        listCustomers(companyId),
        listTripStatusHistory(companyId)
      ]);

      setTrips(loadedTrips);
      setVehicles(loadedVehicles);
      setDrivers(loadedDrivers);
      setCustomers(loadedCustomers);
      setHistory(loadedHistory);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar viagens.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateField = <Field extends keyof TripFormValues>(field: Field, value: TripFormValues[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.vehicleId || !form.driverId || !form.customerId) {
      return "Selecione veiculo, motorista e cliente.";
    }

    if (!form.origin.trim() || !form.destination.trim()) {
      return "Origem e destino sao obrigatorios.";
    }

    if (!form.plannedDepartureAt) {
      return "Saida prevista e obrigatoria.";
    }

    const freightValue = Number(form.freightValue.replace(",", "."));

    if (!Number.isFinite(freightValue) || freightValue < 0) {
      return "Valor do frete deve ser um numero positivo.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateTrip(companyId, editingId, form);
      } else {
        await createTrip(companyId, form);
      }

      resetForm();
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel salvar a viagem.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setForm({
      vehicleId: trip.vehicle_id,
      driverId: trip.driver_id,
      customerId: trip.customer_id,
      origin: trip.origin,
      destination: trip.destination,
      plannedDepartureAt: toDateTimeLocalInput(trip.planned_departure_at),
      actualDepartureAt: toDateTimeLocalInput(trip.actual_departure_at),
      estimatedArrivalAt: toDateTimeLocalInput(trip.estimated_arrival_at),
      actualArrivalAt: toDateTimeLocalInput(trip.actual_arrival_at),
      freightValue: trip.freight_value.toString(),
      status: trip.status,
      notes: trip.notes ?? ""
    });
  };

  const handleDelete = async (trip: Trip) => {
    if (!window.confirm(`Excluir viagem ${trip.origin} > ${trip.destination}?`)) {
      return;
    }

    try {
      setError("");
      await deleteTrip(companyId, trip.id);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel excluir a viagem.");
    }
  };

  const vehicleLabel = (vehicleId: string) => {
    const vehicle = vehicleById.get(vehicleId);
    return vehicle ? `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}` : "-";
  };

  const customerLabel = (customerId: string) => {
    const customer = customerById.get(customerId);
    return customer?.trade_name || customer?.legal_name || "-";
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">Viagens</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Operacao de viagens</h1>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}

      <form className="rounded border border-graphite-100 bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Veiculo">
            <select className={inputClassName} value={form.vehicleId} onChange={(event) => updateField("vehicleId", event.target.value)}>
              <option value="">Selecione</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Motorista">
            <select className={inputClassName} value={form.driverId} onChange={(event) => updateField("driverId", event.target.value)}>
              <option value="">Selecione</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Cliente/fornecedor">
            <select className={inputClassName} value={form.customerId} onChange={(event) => updateField("customerId", event.target.value)}>
              <option value="">Selecione</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.trade_name || customer.legal_name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select className={inputClassName} value={form.status} onChange={(event) => updateField("status", event.target.value as TripStatus)}>
              {tripStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Origem">
            <input className={inputClassName} value={form.origin} onChange={(event) => updateField("origin", event.target.value)} />
          </FormField>
          <FormField label="Destino">
            <input className={inputClassName} value={form.destination} onChange={(event) => updateField("destination", event.target.value)} />
          </FormField>
          <FormField label="Saida prevista">
            <input className={inputClassName} type="datetime-local" value={form.plannedDepartureAt} onChange={(event) => updateField("plannedDepartureAt", event.target.value)} />
          </FormField>
          <FormField label="Saida real">
            <input className={inputClassName} type="datetime-local" value={form.actualDepartureAt} onChange={(event) => updateField("actualDepartureAt", event.target.value)} />
          </FormField>
          <FormField label="Chegada prevista">
            <input className={inputClassName} type="datetime-local" value={form.estimatedArrivalAt} onChange={(event) => updateField("estimatedArrivalAt", event.target.value)} />
          </FormField>
          <FormField label="Chegada real">
            <input className={inputClassName} type="datetime-local" value={form.actualArrivalAt} onChange={(event) => updateField("actualArrivalAt", event.target.value)} />
          </FormField>
          <FormField label="Valor do frete">
            <input className={inputClassName} value={form.freightValue} onChange={(event) => updateField("freightValue", event.target.value)} inputMode="decimal" />
          </FormField>
          <div className="md:col-span-2 lg:col-span-4">
            <FormField label="Observacoes">
              <textarea className={textareaClassName} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="rounded bg-signal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:bg-graphite-100 disabled:text-graphite-700">
            {saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Cadastrar viagem"}
          </button>
          {editingId ? (
            <button type="button" className="rounded border border-graphite-100 px-4 py-2 text-sm font-medium text-graphite-800" onClick={resetForm}>
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingState title="Carregando viagens..." /> : null}

      {!loading && trips.length === 0 ? <EmptyState title="Nenhuma viagem cadastrada" description="Cadastre a primeira viagem operacional." /> : null}

      {!loading && trips.length > 0 ? (
        <div className="overflow-x-auto rounded border border-graphite-100 bg-white shadow-subtle">
          <table className="min-w-full divide-y divide-graphite-100 text-sm">
            <thead className="bg-graphite-50 text-left text-graphite-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Rota</th>
                <th className="px-4 py-3 font-semibold">Veiculo</th>
                <th className="px-4 py-3 font-semibold">Motorista</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Saida prevista</th>
                <th className="px-4 py-3 font-semibold">Frete</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="px-4 py-3 font-medium text-graphite-900">{trip.origin} &gt; {trip.destination}</td>
                  <td className="px-4 py-3 text-graphite-700">{vehicleLabel(trip.vehicle_id)}</td>
                  <td className="px-4 py-3 text-graphite-700">{driverById.get(trip.driver_id)?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-graphite-700">{customerLabel(trip.customer_id)}</td>
                  <td className="px-4 py-3 text-graphite-700">{formatDateTime(trip.planned_departure_at)}</td>
                  <td className="px-4 py-3 text-graphite-700">{formatCurrency(trip.freight_value)}</td>
                  <td className="px-4 py-3 text-graphite-700">{tripStatusLabels[trip.status]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" aria-label="Editar viagem" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-signal-500 hover:text-signal-600" onClick={() => startEdit(trip)}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" aria-label="Excluir viagem" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-red-500 hover:text-red-700" onClick={() => void handleDelete(trip)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && history.length > 0 ? (
        <section className="rounded border border-graphite-100 bg-white shadow-subtle">
          <div className="border-b border-graphite-100 px-4 py-3">
            <h2 className="text-base font-semibold text-graphite-900">Historico de status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-graphite-100 text-sm">
              <thead className="bg-graphite-50 text-left text-graphite-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Viagem</th>
                  <th className="px-4 py-3 font-semibold">Status anterior</th>
                  <th className="px-4 py-3 font-semibold">Novo status</th>
                  <th className="px-4 py-3 font-semibold">Alterado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100">
                {history.map((item) => {
                  const trip = tripById.get(item.trip_id);

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-graphite-700">{trip ? `${trip.origin} > ${trip.destination}` : "-"}</td>
                      <td className="px-4 py-3 text-graphite-700">{item.previous_status ? tripStatusLabels[item.previous_status] : "-"}</td>
                      <td className="px-4 py-3 text-graphite-700">{tripStatusLabels[item.new_status]}</td>
                      <td className="px-4 py-3 text-graphite-700">{formatDateTime(item.changed_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
