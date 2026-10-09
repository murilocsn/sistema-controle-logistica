import { Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useCompany } from "../company/useCompany";
import { FormField, inputClassName, textareaClassName } from "../components/FormField";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { isValidCnpj, isValidEmail, normalizeState } from "../lib/validators";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
  type CustomerFormValues
} from "../services/coreDataService";

const initialForm: CustomerFormValues = {
  legalName: "",
  tradeName: "",
  cnpj: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  notes: ""
};

export function CustomersPage() {
  const { company } = useCompany();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerFormValues>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const companyId = company?.id ?? "";

  const loadCustomers = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setCustomers(await listCustomers(companyId));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar clientes.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const updateField = <Field extends keyof CustomerFormValues>(field: Field, value: CustomerFormValues[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.legalName.trim()) {
      return "Razao social e obrigatoria.";
    }

    if (!isValidCnpj(form.cnpj)) {
      return "CNPJ deve conter 14 digitos.";
    }

    if (!isValidEmail(form.email)) {
      return "E-mail invalido.";
    }

    if (form.state.trim() && normalizeState(form.state).length !== 2) {
      return "Estado deve ter 2 letras.";
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
        await updateCustomer(companyId, editingId, form);
      } else {
        await createCustomer(companyId, form);
      }

      resetForm();
      await loadCustomers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel salvar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      legalName: customer.legal_name,
      tradeName: customer.trade_name ?? "",
      cnpj: customer.cnpj,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
      notes: customer.notes ?? ""
    });
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Excluir cliente ${customer.legal_name}?`)) {
      return;
    }

    try {
      setError("");
      await deleteCustomer(companyId, customer.id);
      await loadCustomers();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel excluir o cliente.");
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">Clientes</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Clientes e fornecedores</h1>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}

      <form className="rounded border border-graphite-100 bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Razao social">
            <input className={inputClassName} value={form.legalName} onChange={(event) => updateField("legalName", event.target.value)} />
          </FormField>
          <FormField label="Nome fantasia">
            <input className={inputClassName} value={form.tradeName} onChange={(event) => updateField("tradeName", event.target.value)} />
          </FormField>
          <FormField label="CNPJ">
            <input className={inputClassName} value={form.cnpj} onChange={(event) => updateField("cnpj", event.target.value)} inputMode="numeric" />
          </FormField>
          <FormField label="Telefone">
            <input className={inputClassName} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
          </FormField>
          <FormField label="E-mail">
            <input className={inputClassName} type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
          </FormField>
          <FormField label="Endereco">
            <input className={inputClassName} value={form.address} onChange={(event) => updateField("address", event.target.value)} />
          </FormField>
          <FormField label="Cidade">
            <input className={inputClassName} value={form.city} onChange={(event) => updateField("city", event.target.value)} />
          </FormField>
          <FormField label="Estado">
            <input className={inputClassName} value={form.state} onChange={(event) => updateField("state", event.target.value)} maxLength={2} />
          </FormField>
          <div className="md:col-span-2 lg:col-span-4">
            <FormField label="Observacoes">
              <textarea className={textareaClassName} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="rounded bg-signal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:bg-graphite-100 disabled:text-graphite-700">
            {saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Cadastrar cliente"}
          </button>
          {editingId ? (
            <button type="button" className="rounded border border-graphite-100 px-4 py-2 text-sm font-medium text-graphite-800" onClick={resetForm}>
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingState title="Carregando clientes..." /> : null}

      {!loading && customers.length === 0 ? <EmptyState title="Nenhum cliente cadastrado" description="Cadastre o primeiro cliente ou fornecedor." /> : null}

      {!loading && customers.length > 0 ? (
        <div className="overflow-x-auto rounded border border-graphite-100 bg-white shadow-subtle">
          <table className="min-w-full divide-y divide-graphite-100 text-sm">
            <thead className="bg-graphite-50 text-left text-graphite-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Razao social</th>
                <th className="px-4 py-3 font-semibold">Nome fantasia</th>
                <th className="px-4 py-3 font-semibold">CNPJ</th>
                <th className="px-4 py-3 font-semibold">Cidade/UF</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-graphite-900">{customer.legal_name}</td>
                  <td className="px-4 py-3 text-graphite-700">{customer.trade_name ?? "-"}</td>
                  <td className="px-4 py-3 text-graphite-700">{customer.cnpj}</td>
                  <td className="px-4 py-3 text-graphite-700">{[customer.city, customer.state].filter(Boolean).join("/") || "-"}</td>
                  <td className="px-4 py-3 text-graphite-700">{customer.email || customer.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" aria-label="Editar cliente" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-signal-500 hover:text-signal-600" onClick={() => startEdit(customer)}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" aria-label="Excluir cliente" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-red-500 hover:text-red-700" onClick={() => void handleDelete(customer)}>
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
