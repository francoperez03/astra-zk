import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const WithdrawSchema = z.object({
  proof: z.string().regex(/^[0-9a-f]+$/),
  nullifier: z.string().length(64).regex(/^[0-9a-f]+$/),
  recipient: z.string().startsWith("G").length(56),
  relayer: z.string().startsWith("G").length(56).optional(),
  fee: z.string().optional(),
});

export const withdrawRoutes: FastifyPluginAsync = async (app) => {
  // Submit withdrawal
  app.post("/", async (request, reply) => {
    const body = WithdrawSchema.parse(request.body);

    // TODO: Verify proof
    // TODO: Submit to blockchain
    // TODO: Return txHash

    return {
      status: "pending",
      nullifier: body.nullifier,
      txHash: null,
    };
  });

  // Get withdrawal status
  app.get("/:nullifier", async (request, reply) => {
    const { nullifier } = request.params as { nullifier: string };

    // TODO: Look up withdrawal status

    return {
      nullifier,
      status: "pending",
      txHash: null,
    };
  });
};
