import { Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useCompany } from "../company/useCompany";
import { FormField, inputClassName, textareaClassName } from "../components/FormField";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { isValidPlate } from "../lib/validators";
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
  type Vehicle,
  type VehicleFormValues,
  type VehicleStatus
} from "../services/coreDataService";

const initialForm: VehicleFormValues = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  capacityKg: "",
  odometer: "0",
  status: "available",
  notes: ""
};

const statusOptions: { value: VehicleStatus; label: string }[] = [
  { value: "available", label: "Disponivel" },
  { value: "in_trip", label: "Em viagem" },
  { value: "maintenance", label: "Manutencao" },
  { value: "inactive", label: "Inativo" }
];

const statusLabels = Object.fromEntries(statusOptions.map((option) => [option.value, option.label])) as Record<VehicleStatus, string>;

export function VehiclesPage() {
  const { company } = useCompany();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<VehicleFormValues>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const companyId = company?.id ?? "";

  const loadVehicles = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setVehicles(await listVehicles(companyId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar veiculos.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const updateField = (field: keyof VehicleFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!isValidPlate(form.plate)) {
      return "Informe uma placa valida. Exemplos: ABC1234 ou ABC1D23.";
    }

    if (!form.brand.trim() || !form.model.trim()) {
      return "Marca e modelo sao obrigatorios.";
    }

    const year = form.year.trim() ? Number(form.year) : null;

    if (year !== null && (!Number.isInteger(year) || year < 1950 || year > 2100)) {
      return "Ano deve ser um numero inteiro entre 1950 e 2100.";
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
        await updateVehicle(companyId, editingId, form);
      } else {
        await createVehicle(companyId, form);
      }

      resetForm();
      await loadVehicles();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel salvar o veiculo.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setForm({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year?.toString() ?? "",
      capacityKg: vehicle.capacity_kg?.toString() ?? "",
      odometer: vehicle.odometer.toString(),
      status: vehicle.status,
      notes: vehicle.notes ?? ""
    });
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!window.confirm(`Excluir veiculo ${vehicle.plate}?`)) {
      return;
    }

    try {
      setError("");
      await deleteVehicle(companyId, vehicle.id);
      await loadVehicles();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel excluir o veiculo.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">Veiculos</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Cadastro de veiculos</h1>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}

      <form className="rounded border border-graphite-100 bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Placa">
            <input className={inputClassName} value={form.plate} onChange={(event) => updateField("plate", event.target.value)} />
          </FormField>
          <FormField label="Marca">
            <input className={inputClassName} value={form.brand} onChange={(event) => updateField("brand", event.target.value)} />
          </FormField>
          <FormField label="Modelo">
            <input className={inputClassName} value={form.model} onChange={(event) => updateField("model", event.target.value)} />
          </FormField>
          <FormField label="Ano">
            <input className={inputClassName} value={form.year} onChange={(event) => updateField("year", event.target.value)} inputMode="numeric" />
          </FormField>
          <FormField label="Capacidade kg">
            <input className={inputClassName} value={form.capacityKg} onChange={(event) => updateField("capacityKg", event.target.value)} inputMode="decimal" />
          </FormField>
          <FormField label="Hodometro">
            <input className={inputClassName} value={form.odometer} onChange={(event) => updateField("odometer", event.target.value)} inputMode="decimal" />
          </FormField>
          <FormField label="Status">
            <select className={inputClassName} value={form.status} onChange={(event) => updateField("status", event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-2 lg:col-span-4">
            <FormField label="Observacoes">
              <textarea className={textareaClassName} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="rounded bg-signal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:bg-graphite-100 disabled:text-graphite-700">
            {saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Cadastrar veiculo"}
          </button>
          {editingId ? (
            <button type="button" className="rounded border border-graphite-100 px-4 py-2 text-sm font-medium text-graphite-800" onClick={resetForm}>
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingState title="Carregando veiculos..." /> : null}

      {!loading && vehicles.length === 0 ? <EmptyState title="Nenhum veiculo cadastrado" description="Cadastre o primeiro veiculo da frota." /> : null}

      {!loading && vehicles.length > 0 ? (
        <div className="overflow-x-auto rounded border border-graphite-100 bg-white shadow-subtle">
          <table className="min-w-full divide-y divide-graphite-100 text-sm">
            <thead className="bg-graphite-50 text-left text-graphite-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Placa</th>
                <th className="px-4 py-3 font-semibold">Veiculo</th>
                <th className="px-4 py-3 font-semibold">Ano</th>
                <th className="px-4 py-3 font-semibold">Hodometro</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-4 py-3 font-medium text-graphite-900">{vehicle.plate}</td>
                  <td className="px-4 py-3 text-graphite-700">{vehicle.brand} {vehicle.model}</td>
                  <td className="px-4 py-3 text-graphite-700">{vehicle.year ?? "-"}</td>
                  <td className="px-4 py-3 text-graphite-700">{vehicle.odometer}</td>
                  <td className="px-4 py-3 text-graphite-700">{statusLabels[vehicle.status]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" aria-label="Editar veiculo" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-signal-500 hover:text-signal-600" onClick={() => startEdit(vehicle)}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" aria-label="Excluir veiculo" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-red-500 hover:text-red-700" onClick={() => void handleDelete(vehicle)}>
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
    </section>
  );
}
