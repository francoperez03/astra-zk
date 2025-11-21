import type { Note, PoolInfo } from "./types.js";

export const MOCK_POOL: PoolInfo = {
  address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  tokenAddress: "native",
  denomination: BigInt(10_000_000), // 1 XLM in stroops
  totalDeposits: 42,
  currentRoot: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
};

export const MOCK_NOTES: Note[] = [
  {
    id: "note-001",
    ownerAccount: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    blinding: "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2",
    commitment: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    amount: BigInt(100_000_000), // 10 XLM
    poolAddress: MOCK_POOL.address,
    leafIndex: 5,
    depositTxHash: "abc123def456",
    status: "deposited",
    createdAt: new Date("2024-01-15T10:30:00Z"),
  },
  {
    id: "note-002",
    ownerAccount: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    blinding: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    commitment: "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    amount: BigInt(50_000_000), // 5 XLM
    poolAddress: MOCK_POOL.address,
    leafIndex: 12,
    depositTxHash: "xyz789abc012",
    status: "deposited",
    createdAt: new Date("2024-01-20T14:45:00Z"),
  },
];

export function createMockNote(amount: bigint, poolAddress: string): Note {
  const randomHex = (len: number) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  return {
    id: `note-${Date.now()}`,
    ownerAccount: randomHex(64),
    blinding: randomHex(64),
    commitment: randomHex(64),
    amount,
    poolAddress,
    status: "pending",
    createdAt: new Date(),
  };
}
