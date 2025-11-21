const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiClient {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "API request failed");
    }

    return response.json();
  }

  // Deposits
  async submitDeposit(commitment: string, depositor: string) {
    return this.fetch<{ status: string; commitment: string }>("/api/v1/deposits", {
      method: "POST",
      body: JSON.stringify({ commitment, depositor }),
    });
  }

  async getDepositStatus(commitment: string) {
    return this.fetch<{
      commitment: string;
      status: string;
      leafIndex: number | null;
      txHash: string | null;
    }>(`/api/v1/deposits/${commitment}`);
  }

  // Withdrawals
  async submitWithdrawal(params: {
    proof: string;
    nullifier: string;
    recipient: string;
    relayer?: string;
    fee?: string;
  }) {
    return this.fetch<{ status: string; txHash: string | null }>("/api/v1/withdrawals", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Merkle
  async getMerklePath(poolAddress: string, leafIndex: number) {
    return this.fetch<{
      leafIndex: number;
      root: string;
      path: string[];
      indices: number[];
    }>("/api/v1/merkle/path", {
      method: "POST",
      body: JSON.stringify({ poolAddress, leafIndex }),
    });
  }

  async getMerkleRoot(poolAddress: string) {
    return this.fetch<{
      poolAddress: string;
      root: string;
      totalDeposits: number;
    }>(`/api/v1/merkle/root/${poolAddress}`);
  }
}

export const api = new ApiClient();
