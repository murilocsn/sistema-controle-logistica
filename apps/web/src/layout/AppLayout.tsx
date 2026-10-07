import {
  BarChart3,
  CreditCard,
  Menu,
  Route,
  Satellite,
  Settings,
  Truck,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const mainItems = [
  { label: "Dashboard", path: "/", icon: BarChart3 },
  { label: "Veiculos", path: "/vehicles", icon: Truck },
  { label: "Motoristas", path: "/drivers", icon: UserRound },
  { label: "Clientes", path: "/customers", icon: UsersRound },
  { label: "Viagens", path: "/trips", icon: Route },
  { label: "Rastreamento", path: "/tracking", icon: Satellite },
  { label: "Despesas", path: "/expenses", icon: CreditCard }
];

const settingsItems = [
  { label: "Integracoes", path: "/settings/integrations" },
  { label: "Usuarios", path: "/settings/users" }
];

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-graphite-50 text-graphite-900">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-graphite-100 bg-white px-4 shadow-subtle lg:hidden">
        <div>
          <p className="text-sm font-semibold text-graphite-900">Controle Logistica</p>
          <p className="text-xs text-graphite-700">Frota operacional</p>
        </div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          className="grid h-10 w-10 place-items-center rounded border border-graphite-100 text-graphite-800"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-graphite-100 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-graphite-100 px-5 py-5">
            <p className="text-base font-semibold text-graphite-900">Controle Logistica</p>
            <p className="mt-1 text-sm text-graphite-700">Gestao de frota</p>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {mainItems.map((item) => (
                <NavItem
                  key={item.path}
                  label={item.label}
                  path={item.path}
                  icon={<item.icon size={18} />}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-graphite-700">
                <Settings size={14} />
                Configuracoes
              </div>
              <div className="space-y-1">
                {settingsItems.map((item) => (
                  <NavItem
                    key={item.path}
                    label={item.label}
                    path={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </div>
          </nav>

          <div className="border-t border-graphite-100 p-4">
            <p className="truncate text-sm font-medium text-graphite-900">{user?.email}</p>
            <button
              type="button"
              className="mt-3 w-full rounded border border-graphite-100 px-3 py-2 text-sm font-medium text-graphite-800 transition hover:border-signal-500 hover:text-signal-600"
              onClick={handleSignOut}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-graphite-900/30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

type NavItemProps = {
  label: string;
  path: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

function NavItem({ label, path, icon, onClick }: NavItemProps) {
  return (
    <NavLink
      to={path}
      end={path === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex min-h-10 items-center gap-3 rounded px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-signal-500 text-white"
            : "text-graphite-700 hover:bg-graphite-50 hover:text-graphite-900"
        ].join(" ")
      }
    >
      {icon ? <span className="grid h-5 w-5 place-items-center">{icon}</span> : <span className="h-5 w-5" />}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
