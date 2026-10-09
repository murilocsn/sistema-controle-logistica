import { Outlet } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/PageState";
import { CompanySetupPage } from "../pages/CompanySetupPage";
import { useCompany } from "./useCompany";

export function RequireCompany() {
  const { company, loading, error } = useCompany();

  if (loading) {
    return <LoadingState title="Carregando empresa..." />;
  }

  if (error) {
    return <ErrorState title="Erro ao carregar empresa" description={error} />;
  }

  if (!company) {
    return <CompanySetupPage />;
  }

  return <Outlet />;
}
