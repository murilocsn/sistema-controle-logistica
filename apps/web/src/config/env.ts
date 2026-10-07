export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
  apiUrl: import.meta.env.VITE_API_URL?.trim() ?? "http://localhost:3333"
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
