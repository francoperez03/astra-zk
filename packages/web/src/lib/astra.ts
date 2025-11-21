import { AstraClient } from "@astra/sdk";

// Default pool address (testnet)
export const DEFAULT_POOL = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// Singleton SDK client
export const astra = new AstraClient({
  rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  apiUrl: process.env.NEXT_PUBLIC_BUNDLER_URL || "http://localhost:3001",
});
