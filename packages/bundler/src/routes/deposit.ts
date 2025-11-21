import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const DepositSchema = z.object({
  commitment: z.string().length(64).regex(/^[0-9a-f]+$/),
  depositor: z.string().startsWith("G").length(56),
});

export const depositRoutes: FastifyPluginAsync = async (app) => {
  // Queue a deposit
  app.post("/", async (request, reply) => {
    const body = DepositSchema.parse(request.body);

    // TODO: Add to deposit queue
    // TODO: Return pending status

    return {
      status: "pending",
      commitment: body.commitment,
    };
  });

  // Get deposit status
  app.get("/:commitment", async (request, reply) => {
    const { commitment } = request.params as { commitment: string };

    // TODO: Look up deposit status from DB

    return {
      commitment,
      status: "pending",
      leafIndex: null,
      txHash: null,
    };
  });
};
