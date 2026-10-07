import "dotenv/config";

type ApiEnv = {
  port: number;
  webOrigin: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseConfigured: boolean;
};

function readPort() {
  const rawPort = process.env.API_PORT ?? "3333";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("API_PORT deve ser um numero inteiro positivo.");
  }

  return port;
}

function readOptional(name: string) {
  return process.env[name]?.trim() ?? "";
}

const supabaseUrl = readOptional("SUPABASE_URL");
const supabaseAnonKey = readOptional("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = readOptional("SUPABASE_SERVICE_ROLE_KEY");

export const env: ApiEnv = {
  port: readPort(),
  webOrigin: process.env.WEB_ORIGIN?.trim() || "http://localhost:5173",
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey)
};
