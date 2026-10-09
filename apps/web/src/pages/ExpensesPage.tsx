import { Pencil, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useCompany } from "../company/useCompany";
import { FormField, inputClassName, textareaClassName } from "../components/FormField";
import { EmptyState, ErrorState, LoadingState } from "../components/PageState";
import { formatCurrency, formatDate, formatDateTime, todayInputDate } from "../lib/formatters";
import {
  createTripExpense,
  deleteTripExpense,
  listTripExpenses,
  listTrips,
  updateTripExpense,
  type ExpenseFormValues,
  type ExpenseType,
  type Trip,
  type TripExpense
} from "../services/coreDataService";

const expenseTypeOptions: { value: ExpenseType; label: string }[] = [
  { value: "fuel", label: "Combustivel" },
  { value: "toll", label: "Pedagio" },
  { value: "food", label: "Alimentacao" },
  { value: "parking", label: "Estacionamento" },
  { value: "maintenance", label: "Manutencao" },
  { value: "other", label: "Outras" }
];

const expenseTypeLabels = Object.fromEntries(expenseTypeOptions.map((option) => [option.value, option.label])) as Record<
  ExpenseType,
  string
>;

function createInitialForm(): ExpenseFormValues {
  return {
    tripId: "",
    expenseType: "fuel",
    description: "",
    amount: "",
    expenseDate: todayInputDate(),
    notes: ""
  };
}

export function ExpensesPage() {
  const { company } = useCompany();
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [form, setForm] = useState<ExpenseFormValues>(createInitialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const companyId = company?.id ?? "";
  const tripById = useMemo(() => new Map(trips.map((trip) => [trip.id, trip])), [trips]);

  const tripResults = useMemo(
    () =>
      trips.map((trip) => {
        const totalExpenses = expenses
          .filter((expense) => expense.trip_id === trip.id)
          .reduce((total, expense) => total + Number(expense.amount), 0);

        return {
          trip,
          expenses: totalExpenses,
          result: Number(trip.freight_value) - totalExpenses
        };
      }),
    [expenses, trips]
  );

  const loadData = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [loadedExpenses, loadedTrips] = await Promise.all([listTripExpenses(companyId), listTrips(companyId)]);
      setExpenses(loadedExpenses);
      setTrips(loadedTrips);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar despesas.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateField = <Field extends keyof ExpenseFormValues>(field: Field, value: ExpenseFormValues[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(createInitialForm());
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.tripId) {
      return "Selecione uma viagem.";
    }

    if (!form.description.trim()) {
      return "Descricao e obrigatoria.";
    }

    const amount = Number(form.amount.replace(",", "."));

    if (!Number.isFinite(amount) || amount <= 0) {
      return "Valor deve ser maior que zero.";
    }

    if (!form.expenseDate) {
      return "Data da despesa e obrigatoria.";
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
        await updateTripExpense(companyId, editingId, form);
      } else {
        await createTripExpense(companyId, form);
      }

      resetForm();
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel salvar a despesa.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (expense: TripExpense) => {
    setEditingId(expense.id);
    setForm({
      tripId: expense.trip_id,
      expenseType: expense.expense_type,
      description: expense.description,
      amount: expense.amount.toString(),
      expenseDate: expense.expense_date,
      notes: expense.notes ?? ""
    });
  };

  const handleDelete = async (expense: TripExpense) => {
    if (!window.confirm(`Excluir despesa ${expense.description}?`)) {
      return;
    }

    try {
      setError("");
      await deleteTripExpense(companyId, expense.id);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel excluir a despesa.");
    }
  };

  const tripLabel = (trip: Trip) => `${trip.origin} > ${trip.destination} (${formatDateTime(trip.planned_departure_at)})`;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-signal-600">Despesas</p>
        <h1 className="mt-1 text-2xl font-semibold text-graphite-900">Despesas de viagem</h1>
      </div>

      {error ? <ErrorState title="Atencao" description={error} /> : null}

      <form className="rounded border border-graphite-100 bg-white p-4 shadow-subtle" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField label="Viagem">
            <select className={inputClassName} value={form.tripId} onChange={(event) => updateField("tripId", event.target.value)}>
              <option value="">Selecione</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {tripLabel(trip)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tipo">
            <select className={inputClassName} value={form.expenseType} onChange={(event) => updateField("expenseType", event.target.value as ExpenseType)}>
              {expenseTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Descricao">
            <input className={inputClassName} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
          </FormField>
          <FormField label="Valor">
            <input className={inputClassName} value={form.amount} onChange={(event) => updateField("amount", event.target.value)} inputMode="decimal" />
          </FormField>
          <FormField label="Data">
            <input className={inputClassName} type="date" value={form.expenseDate} onChange={(event) => updateField("expenseDate", event.target.value)} />
          </FormField>
          <div className="md:col-span-2 lg:col-span-4">
            <FormField label="Observacoes">
              <textarea className={textareaClassName} value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="rounded bg-signal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:bg-graphite-100 disabled:text-graphite-700">
            {saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Registrar despesa"}
          </button>
          {editingId ? (
            <button type="button" className="rounded border border-graphite-100 px-4 py-2 text-sm font-medium text-graphite-800" onClick={resetForm}>
              Cancelar edicao
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingState title="Carregando despesas..." /> : null}

      {!loading && tripResults.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {tripResults.slice(0, 6).map(({ trip, expenses: totalExpenses, result }) => (
            <div key={trip.id} className="rounded border border-graphite-100 bg-white p-4 shadow-subtle">
              <p className="truncate text-sm font-semibold text-graphite-900">{trip.origin} &gt; {trip.destination}</p>
              <dl className="mt-3 space-y-2 text-sm text-graphite-700">
                <div className="flex justify-between gap-3">
                  <dt>Receita</dt>
                  <dd className="font-medium text-graphite-900">{formatCurrency(trip.freight_value)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Despesas</dt>
                  <dd className="font-medium text-graphite-900">{formatCurrency(totalExpenses)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-graphite-100 pt-2">
                  <dt>Resultado</dt>
                  <dd className={result >= 0 ? "font-semibold text-signal-600" : "font-semibold text-red-700"}>{formatCurrency(result)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && expenses.length === 0 ? <EmptyState title="Nenhuma despesa cadastrada" description="Registre a primeira despesa de viagem." /> : null}

      {!loading && expenses.length > 0 ? (
        <div className="overflow-x-auto rounded border border-graphite-100 bg-white shadow-subtle">
          <table className="min-w-full divide-y divide-graphite-100 text-sm">
            <thead className="bg-graphite-50 text-left text-graphite-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Viagem</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Descricao</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {expenses.map((expense) => {
                const trip = tripById.get(expense.trip_id);

                return (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 font-medium text-graphite-900">{trip ? `${trip.origin} > ${trip.destination}` : "-"}</td>
                    <td className="px-4 py-3 text-graphite-700">{expenseTypeLabels[expense.expense_type]}</td>
                    <td className="px-4 py-3 text-graphite-700">{expense.description}</td>
                    <td className="px-4 py-3 text-graphite-700">{formatDate(expense.expense_date)}</td>
                    <td className="px-4 py-3 text-graphite-700">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" aria-label="Editar despesa" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-signal-500 hover:text-signal-600" onClick={() => startEdit(expense)}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" aria-label="Excluir despesa" className="grid h-9 w-9 place-items-center rounded border border-graphite-100 text-graphite-800 hover:border-red-500 hover:text-red-700" onClick={() => void handleDelete(expense)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
