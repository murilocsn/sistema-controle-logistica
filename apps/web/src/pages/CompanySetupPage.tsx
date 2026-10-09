import { Building2, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { FormField, inputClassName } from "../components/FormField";
import { useCompany } from "../company/useCompany";

export function CompanySetupPage() {
  const { user, signOut } = useAuth();
  const { createCompany } = useCompany();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      setSubmitting(true);
      await createCompany(name);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel criar a empresa.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-graphite-50 px-4 py-8 text-graphite-900">
      <section className="w-full max-w-md rounded border border-graphite-100 bg-white p-6 shadow-subtle">
        <div className="grid h-12 w-12 place-items-center rounded bg-signal-500 text-white">
          <Building2 size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Configurar empresa</h1>
        <p className="mt-2 text-sm text-graphite-700">
          Crie a empresa inicial para habilitar os cadastros operacionais.
        </p>
        <p className="mt-2 truncate text-xs text-graphite-700">Usuario: {user?.email}</p>

        {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <FormField label="Nome da empresa">
            <input className={inputClassName} value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded bg-signal-500 px-4 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:cursor-not-allowed disabled:bg-graphite-100 disabled:text-graphite-700"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Criar empresa
          </button>
        </form>

        <button
          type="button"
          className="mt-3 w-full rounded border border-graphite-100 px-3 py-2 text-sm font-medium text-graphite-800 transition hover:border-signal-500 hover:text-signal-600"
          onClick={() => void signOut()}
        >
          Sair
        </button>
      </section>
    </main>
  );
}
