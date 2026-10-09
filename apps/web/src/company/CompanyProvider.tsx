import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabaseClient } from "../lib/supabase";
import type { Database } from "../types/supabase";

type Company = Database["public"]["Tables"]["companies"]["Row"];
type CompanyRole = Database["public"]["Tables"]["company_users"]["Row"]["role"];

type CompanyContextValue = {
  company: Company | null;
  role: CompanyRole | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  createCompany: (name: string) => Promise<void>;
};

export const CompanyContext = createContext<CompanyContextValue | null>(null);

type CompanyProviderProps = {
  children: ReactNode;
};

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<CompanyRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseClient();
      const { data: membership, error: membershipError } = await supabase
        .from("company_users")
        .select("company_id, role")
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (!membership) {
        setCompany(null);
        setRole(null);
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", membership.company_id)
        .single();

      if (companyError) {
        throw companyError;
      }

      setCompany(companyData);
      setRole(membership.role);
    } catch (caughtError) {
      setCompany(null);
      setRole(null);
      setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel carregar a empresa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCompany = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();

      if (trimmedName.length < 2) {
        throw new Error("Informe o nome da empresa.");
      }

      const supabase = getSupabaseClient();
      const { error: createError } = await supabase.rpc("create_company_for_current_user", {
        company_name: trimmedName
      });

      if (createError) {
        throw createError;
      }

      await refresh();
    },
    [refresh]
  );

  const value = useMemo<CompanyContextValue>(
    () => ({ company, role, loading, error, refresh, createCompany }),
    [company, role, loading, error, refresh, createCompany]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
