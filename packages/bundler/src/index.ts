import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { depositRoutes } from "./routes/deposit.js";
import { withdrawRoutes } from "./routes/withdraw.js";
import { merkleRoutes } from "./routes/merkle.js";

const app = Fastify({ logger: true });

async function main() {
  // Register plugins
  await app.register(cors, {
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Register routes
  await app.register(depositRoutes, { prefix: "/api/v1/deposits" });
  await app.register(withdrawRoutes, { prefix: "/api/v1/withdrawals" });
  await app.register(merkleRoutes, { prefix: "/api/v1/merkle" });

  // Health check
  app.get("/health", async () => ({ status: "ok", version: "0.1.0" }));

  // Start server
  const port = parseInt(process.env.PORT || "3001");
  const host = process.env.HOST || "0.0.0.0";

  try {
    await app.listen({ port, host });
    console.log(`Bundler running at http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
