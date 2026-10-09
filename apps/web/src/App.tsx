import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { CompanyProvider } from "./company/CompanyProvider";
import { RequireCompany } from "./company/RequireCompany";
import { AppLayout } from "./layout/AppLayout";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DriversPage } from "./pages/DriversPage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { VehiclesPage } from "./pages/VehiclesPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <CompanyProvider>
              <RequireCompany />
            </CompanyProvider>
          }
        >
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="trips" element={<PlaceholderPage title="Viagens" />} />
            <Route path="tracking" element={<PlaceholderPage title="Rastreamento" />} />
            <Route path="expenses" element={<PlaceholderPage title="Despesas" />} />
            <Route path="settings/integrations" element={<PlaceholderPage title="Integracoes" />} />
            <Route path="settings/users" element={<PlaceholderPage title="Usuarios" />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
