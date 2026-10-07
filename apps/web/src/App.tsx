import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<PlaceholderPage title="Veiculos" />} />
          <Route path="drivers" element={<PlaceholderPage title="Motoristas" />} />
          <Route path="customers" element={<PlaceholderPage title="Clientes" />} />
          <Route path="trips" element={<PlaceholderPage title="Viagens" />} />
          <Route path="tracking" element={<PlaceholderPage title="Rastreamento" />} />
          <Route path="expenses" element={<PlaceholderPage title="Despesas" />} />
          <Route path="settings/integrations" element={<PlaceholderPage title="Integracoes" />} />
          <Route path="settings/users" element={<PlaceholderPage title="Usuarios" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
