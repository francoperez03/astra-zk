import {
  SorobanRpc,
  Contract,
  TransactionBuilder,
  Networks,
  Keypair,
  xdr,
  Address,
} from "@stellar/stellar-sdk";

export class StellarService {
  private server: SorobanRpc.Server;
  private privacyPool: Contract;
  private keypair: Keypair;
  private networkPassphrase: string;

  constructor(config: {
    rpcUrl: string;
    privacyPoolAddress: string;
    relayerSecret: string;
    network: "testnet" | "mainnet";
  }) {
    this.server = new SorobanRpc.Server(config.rpcUrl);
    this.privacyPool = new Contract(config.privacyPoolAddress);
    this.keypair = Keypair.fromSecret(config.relayerSecret);
    this.networkPassphrase =
      config.network === "mainnet"
        ? Networks.PUBLIC
        : Networks.TESTNET;
  }

  async submitDeposit(params: {
    depositor: string;
    commitment: string;
    proof: string;
    newRoot: string;
  }): Promise<{ txHash: string; leafIndex: number }> {
    const source = await this.server.getAccount(this.keypair.publicKey());

    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.privacyPool.call(
          "deposit",
          new Address(params.depositor).toScVal(),
          xdr.ScVal.scvBytes(Buffer.from(params.commitment, "hex")),
          xdr.ScVal.scvBytes(Buffer.from(params.proof, "hex")),
          xdr.ScVal.scvBytes(Buffer.from(params.newRoot, "hex"))
        )
      )
      .setTimeout(30)
      .build();

    const simResult = await this.server.simulateTransaction(tx);
    if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
      throw new Error("Simulation failed");
    }

    const preparedTx = SorobanRpc.assembleTransaction(tx, simResult);
    preparedTx.sign(this.keypair);

    const response = await this.server.sendTransaction(preparedTx);

    // Wait for confirmation
    let result = await this.server.getTransaction(response.hash);
    while (result.status === "NOT_FOUND") {
      await new Promise((r) => setTimeout(r, 1000));
      result = await this.server.getTransaction(response.hash);
    }

    if (result.status === "FAILED") {
      throw new Error("Transaction failed");
    }

    // TODO: Parse leaf index from result
    return { txHash: response.hash, leafIndex: 0 };
  }

  async submitWithdraw(params: {
    proof: string;
    root: string;
    nullifier: string;
    recipient: string;
    relayer: string;
    fee: bigint;
  }): Promise<{ txHash: string }> {
    // Similar to submitDeposit but calls withdraw
    // TODO: Implement
    return { txHash: "" };
  }

  async isKnownRoot(root: string): Promise<boolean> {
    // TODO: Call contract to check if root is known
    return true;
  }

  async isSpent(nullifier: string): Promise<boolean> {
    // TODO: Call contract to check if nullifier is spent
    return false;
  }
}
