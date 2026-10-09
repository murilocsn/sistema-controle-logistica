import { Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useCompany } from "../company/useCompany";
import { FormField, inputClassName, textareaClassName } from "../components/FormField";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { isValidCpf } from "../lib/validators";
import {
  createDriver,
  deleteDriver,
  listDrivers,
  updateDriver,
  type Driver,
  type DriverFormValues
} from "../services/coreDataService";

const initialForm: DriverFormValues = {
  name: "",
  cpf: "",
  phone: "",
  licenseNumber: "",
  licenseCategory: "",
  licenseExpiresAt: "",
  active: true,
  notes: ""
};

export function DriversPage() {
  const { company } = useCompany();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form, setForm] = useState<DriverFormValues>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const companyId = company?.id ?? "";

  const loadDrivers = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setDrivers(await listDrivers(companyId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar motoristas.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const updateField = <Field extends keyof DriverFormValues>(field: Field, value: DriverFormValues[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Nome do motorista e obrigatorio.";
    }

    if (!isValidCpf(form.cpf)) {
      return "CPF deve conter 11 digitos.";
    }

    if (!form.licenseNumber.trim() || !form.licenseCategory.trim()) {
      return "Numero e categoria da CNH sao obrigatorios.";
    }

    if (!form.licenseExpiresAt) {
      return "Vencimento da CNH e obrigatorio.";
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
        await updateDriver(companyId, editingId, form);
      } else {
        await createDriver(companyId, form);
      }

      resetForm();
      await loadDrivers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel salvar o motorista.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setForm({
      name: driver.name,
      cpf: driver.cpf,
      phone: driver.phone ?? "",
      licenseNumber: driver.license_number,
      licenseCategory: driver.license_category,
      licenseExpiresAt: driver.license_expires_at,
      active: driver.active,
      notes: driver.notes ?? ""
    });
  };

  const handleDelete = async (driver: Driver) => {
    if (!window.confirm(`Excluir motorista ${driver.name}?`)) {
      return;
    }

    try {
      setError("");
      await deleteDriver(companyId, driver.id);
      await loadDrivers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel excluir o motorista.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">Motoristas</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Cadastro de motoristas</h1>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}

      <form className="rounded border border-graphite-100 bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Nome">
            <input className={inputClassName} value={form.name} onChange={(event) => updateField("name", event.target.value)} />
          </FormField>
          <FormField label="CPF">
            <input className={inputClassName} value={form.cpf} onChange={(event) => updateField("cpf", event.target.value)} inputMode="numeric" />
          </FormField>
          <FormField label="Telefone">
            <input className={inputClassName} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
          </FormField>
          <FormField label="Numero CNH">
            <input className={inputClassName} value={form.licenseNumber} onChange={(event) => updateField("licenseNumber", event.target.value)} />
          </FormField>
          <FormField label="Categoria CNH">
            <input className={inputClassName} value={form.licenseCategory} onChange={(event) => updateField("licenseCategory", event.target.value)} />
          </FormField>
          <FormField label="Vencimento CNH">
            <input className={inputClassName} type="date" value={form.licenseExpiresAt} onChange={(event) => updateField("licenseExpiresAt", event.target.value)} />
          </FormField>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-graphite-800">
            <input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} />
            Ativo
          </label>
          <div className="md:col-span-2 lg:col-span-4">
            <FormField label="Observacoes">
              <textarea className={textareaClassName} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="rounded bg-signal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:bg-graphite-100 disabled:text-graphite-700">
            {saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Cadastrar motorista"}
          </button>
          {editingId ? (
            <button type="button" className="rounded border border-graphite-100 px-4 py-2 text-sm font-medium text-graphite-800" onClick={resetForm}>
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingState title="Carregando motoristas..." /> : null}

      {!loading && drivers.length === 0 ? <EmptyState title="Nenhum motorista cadastrado" description="Cadastre o primeiro motorista." /> : null}

      {!loading && drivers.length > 0 ? (
        <div className="overflow-x-auto rounded border border-graphite-100 bg-white shadow-subtle">
          <table className="min-w-full divide-y divide-graphite-100 text-sm">
            <thead className="bg-graphite-50 text-left text-graphite-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">CPF</th>
                <th className="px-4 py-3 font-semibold">CNH</th>
                <th className="px-4 py-3 font-semibold">Vencimento</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="px-4 py-3 font-medium text-graphite-900">{driver.name}</td>
                  <td className="px-4 py-3 text-graphite-700">{driver.cpf}</td>
                  <td className="px-4 py-3 text-graphite-700">{driver.license_number} / {driver.license_category}</td>
                  <td className="px-4 py-3 text-graphite-700">{driver.license_expires_at}</td>
                  <td className="px-4 py-3 text-graphite-700">{driver.active ? "Ativo" : "Inativo"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" aria-label="Editar motorista" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-signal-500 hover:text-signal-600" onClick={() => startEdit(driver)}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" aria-label="Excluir motorista" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-red-500 hover:text-red-700" onClick={() => void handleDelete(driver)}>
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
