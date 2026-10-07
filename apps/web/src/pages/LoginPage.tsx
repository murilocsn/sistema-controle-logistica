import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { configured, loading, session, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as LoginLocationState | null;
  const redirectTo = state?.from?.pathname ?? "/";

  if (!loading && session) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!email.trim() || !password) {
      setFormError("Informe e-mail e senha.");
      return;
    }

    try {
      setSubmitting(true);
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch {
      setFormError("Nao foi possivel entrar com essas credenciais.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-graphite-50 lg:grid-cols-[minmax(0,1fr)_460px]">
      <section className="hidden bg-graphite-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-200">Controle Logistica</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
            Gestao simples e segura para operacoes de frota.
          </h1>
        </div>
        <div className="grid max-w-3xl grid-cols-3 gap-3">
          <div className="rounded border border-white/15 bg-white/8 p-4">
            <p className="text-sm text-teal-100">Auth</p>
            <p className="mt-2 text-lg font-semibold">Supabase</p>
          </div>
          <div className="rounded border border-white/15 bg-white/8 p-4">
            <p className="text-sm text-teal-100">Stack</p>
            <p className="mt-2 text-lg font-semibold">React + Node</p>
          </div>
          <div className="rounded border border-white/15 bg-white/8 p-4">
            <p className="text-sm text-teal-100">MVP</p>
            <p className="mt-2 text-lg font-semibold">Fase 1</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="grid h-12 w-12 place-items-center rounded bg-signal-500 text-white">
              <LockKeyhole size={22} />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-graphite-900">Entrar</h2>
            <p className="mt-2 text-sm text-graphite-700">Acesse o painel administrativo.</p>
          </div>

          {!configured ? (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Configure as variaveis do Supabase para habilitar o login.
            </div>
          ) : null}

          {formError ? (
            <div className="mb-4 flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <span>{formError}</span>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-graphite-800">E-mail</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 h-11 w-full rounded border border-graphite-100 bg-white px-3 text-graphite-900 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-graphite-800">Senha</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 h-11 w-full rounded border border-graphite-100 bg-white px-3 text-graphite-900 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20"
              />
            </label>

            <button
              type="submit"
              disabled={!configured || submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded bg-signal-500 px-4 text-sm font-semibold text-white transition hover:bg-signal-600 disabled:cursor-not-allowed disabled:bg-graphite-100 disabled:text-graphite-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Entrar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
