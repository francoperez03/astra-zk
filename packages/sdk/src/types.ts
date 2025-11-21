export interface AstraConfig {
  rpcUrl: string;
  networkPassphrase: string;
  proofServiceUrl?: string;
  apiUrl?: string;
}

export interface PoolInfo {
  address: string;
  tokenAddress: string;
  denomination: bigint;
  totalDeposits: number;
  currentRoot: string;
}

export type NoteStatus = "pending" | "deposited" | "withdrawing" | "withdrawn" | "failed";

export interface Note {
  id: string;
  /** Owner private key hash: account(private_key) */
  ownerAccount: string;
  /** Random blinding factor */
  blinding: string;
  /** Poseidon2(owner, value, blinding) */
  commitment: string;
  /** Poseidon2(commitment, blinding) - computed on withdraw */
  nullifier?: string;
  /** Amount in stroops */
  amount: bigint;
  /** Pool contract address */
  poolAddress: string;
  /** Merkle tree leaf index */
  leafIndex?: number;
  /** Deposit tx hash */
  depositTxHash?: string;
  /** Withdraw tx hash */
  withdrawTxHash?: string;
  status: NoteStatus;
  createdAt: Date;
}

export interface DepositResult {
  txHash: string;
  leafIndex: number;
  status: "success" | "failed";
}

export interface WithdrawResult {
  txHash: string;
  status: "success" | "failed";
  nullifier?: string;
}

export interface MerklePath {
  root: string;
  path: string[];
  indices: number[];
}
