import { NoteGenerator, NoteParser } from "./note.js";
import { MOCK_POOL, createMockNote } from "./mock.js";
import type {
  AstraConfig,
  Note,
  PoolInfo,
  DepositResult,
  WithdrawResult,
  MerklePath,
} from "./types.js";

// Set to true to use real Stellar connection (not implemented yet)
const USE_REAL_CONNECTION = false;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class AstraClient {
  private config: AstraConfig;
  private noteGenerator: NoteGenerator;

  constructor(config: AstraConfig) {
    this.config = config;
    this.noteGenerator = new NoteGenerator();
  }

  // ============================================
  // Pool Operations
  // ============================================

  async getPoolInfo(poolAddress: string): Promise<PoolInfo> {
    if (USE_REAL_CONNECTION) {
      // TODO: Real Soroban query
      throw new Error("Not implemented");
    }

    await delay(200);
    return {
      ...MOCK_POOL,
      address: poolAddress,
    };
  }

  async getMerklePath(poolAddress: string, leafIndex: number): Promise<MerklePath> {
    if (USE_REAL_CONNECTION) {
      // TODO: Query bundler API for merkle path
      throw new Error("Not implemented");
    }

    await delay(150);
    const path = Array.from({ length: 20 }, (_, i) =>
      `0x${(i + leafIndex).toString(16).padStart(64, "0")}`
    );
    const indices = Array.from({ length: 20 }, (_, i) => (leafIndex >> i) & 1);

    return {
      root: MOCK_POOL.currentRoot,
      path,
      indices,
    };
  }

  async isSpent(poolAddress: string, nullifier: string): Promise<boolean> {
    if (USE_REAL_CONNECTION) {
      // TODO: Query contract nullifier_spent mapping
      throw new Error("Not implemented");
    }

    await delay(100);
    return false;
  }

  // ============================================
  // Deposit
  // ============================================

  async deposit(params: {
    commitment: string;
    amount: bigint;
    signTransaction: (xdr: string) => Promise<string>;
  }): Promise<DepositResult> {
    if (USE_REAL_CONNECTION) {
      // TODO: Build and submit Soroban transaction
      // 1. Call contract.deposit(commitment, amount)
      // 2. Sign with provided signer
      // 3. Submit and wait for confirmation
      throw new Error("Not implemented");
    }

    await delay(1500);
    return {
      txHash: `mock_deposit_${Date.now().toString(16)}`,
      leafIndex: MOCK_POOL.totalDeposits + 1,
      status: "success",
    };
  }

  // ============================================
  // Withdraw
  // ============================================

  async generateProof(params: {
    note: Note;
    recipient: string;
    merklePath: MerklePath;
  }): Promise<string> {
    if (USE_REAL_CONNECTION) {
      // TODO: Call bundler API to generate ZK proof
      // POST /api/v1/proof { note, recipient, merklePath }
      throw new Error("Not implemented");
    }

    await delay(1500);
    return `mock_proof_${Date.now().toString(16)}`;
  }

  async withdraw(params: {
    nullifier: string;
    recipient: string;
    proof: string;
    signTransaction: (xdr: string) => Promise<string>;
  }): Promise<WithdrawResult> {
    if (USE_REAL_CONNECTION) {
      // TODO: Build and submit Soroban transaction
      // 1. Call contract.withdraw(nullifier, recipient, proof)
      // 2. Sign with provided signer
      // 3. Submit and wait for confirmation
      throw new Error("Not implemented");
    }

    await delay(1500);
    return {
      txHash: `mock_withdraw_${Date.now().toString(16)}`,
      status: "success",
      nullifier: params.nullifier,
    };
  }

  // ============================================
  // Note Utilities
  // ============================================

  async generateNote(params: {
    privateKey: string;
    amount: bigint;
    poolAddress: string;
  }): Promise<Note> {
    if (!USE_REAL_CONNECTION) {
      // In mock mode, generate a random note without using privateKey
      await delay(200);
      return createMockNote(params.amount, params.poolAddress);
    }
    return this.noteGenerator.generate(params);
  }

  computeNullifier(note: Note): string {
    return this.noteGenerator.computeNullifier(note);
  }

  parseNote(noteString: string): Note {
    return NoteParser.parse(noteString);
  }

  serializeNote(note: Note): string {
    return NoteParser.serialize(note);
  }
}
