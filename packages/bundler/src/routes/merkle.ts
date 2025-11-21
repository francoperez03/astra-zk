import { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const MerklePathSchema = z.object({
  poolAddress: z.string().startsWith("C"),
  leafIndex: z.number().int().min(0),
});

export const merkleRoutes: FastifyPluginAsync = async (app) => {
  // Get merkle path for a leaf
  app.post("/path", async (request, reply) => {
    const body = MerklePathSchema.parse(request.body);

    // TODO: Look up merkle path from indexed tree

    return {
      leafIndex: body.leafIndex,
      root: "0".repeat(64), // placeholder
      path: [],
      indices: [],
    };
  });

  // Get current root
  app.get("/root/:poolAddress", async (request, reply) => {
    const { poolAddress } = request.params as { poolAddress: string };

    // TODO: Get current root from contract

    return {
      poolAddress,
      root: "0".repeat(64), // placeholder
      totalDeposits: 0,
    };
  });
};
