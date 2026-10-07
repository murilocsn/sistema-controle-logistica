import type { NextFunction, Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../lib/supabase.js";

export type AuthenticatedRequest = Request & {
  user: User;
};

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  let supabaseAdmin: ReturnType<typeof getSupabaseAdmin>;

  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    res.status(503).json({ error: "Supabase nao configurado na API." });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

  if (!token) {
    res.status(401).json({ error: "Token ausente." });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Token invalido." });
    return;
  }

  (req as AuthenticatedRequest).user = data.user;
  next();
}
