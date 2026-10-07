import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { type AuthenticatedRequest, requireAuth } from "./middleware/requireAuth.js";

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;

    res.json({
      id: authenticatedReq.user.id,
      email: authenticatedReq.user.email ?? null
    });
  });

  return app;
}

const app = createServer();

app.listen(env.port, () => {
  console.log(`API ouvindo na porta ${env.port}`);
});
