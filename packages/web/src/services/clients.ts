import type { Note } from "@astra/sdk";

export interface Client {
  id: string;
  name: string;
  stellarAddress: string;
  publicBalance: bigint;
  privateBalance: bigint;
  notes: Note[];
}

// Mock data for demo
const MOCK_CLIENTS: Client[] = [
  {
    id: "client-001",
    name: "Juan Pérez",
    stellarAddress: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOUJ3BXFFOBVEPQZ",
    publicBalance: BigInt(15_000_000_000), // 1,500 XLM
    privateBalance: BigInt(5_000_000_000), // 500 XLM
    notes: [],
  },
  {
    id: "client-002",
    name: "María García",
    stellarAddress: "GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR",
    publicBalance: BigInt(32_000_000_000), // 3,200 XLM
    privateBalance: BigInt(12_000_000_000), // 1,200 XLM
    notes: [],
  },
  {
    id: "client-003",
    name: "Carlos López",
    stellarAddress: "GCFXHS4GXL6BVUCXBWXGTITROWLVYXQKQLF4YH5O5JT3YZXCYPAFBJZB",
    publicBalance: BigInt(8_500_000_000), // 850 XLM
    privateBalance: BigInt(2_500_000_000), // 250 XLM
    notes: [],
  },
  {
    id: "client-004",
    name: "Ana Martínez",
    stellarAddress: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    publicBalance: BigInt(45_000_000_000), // 4,500 XLM
    privateBalance: BigInt(0), // 0 XLM
    notes: [],
  },
  {
    id: "client-005",
    name: "Roberto Sánchez",
    stellarAddress: "GDW6AUTBXTOC7 VOICES5GDJSB5UTFCLY5OYHCB5HNDTMWZQFJBFQXF7F",
    publicBalance: BigInt(500_000_000), // 50 XLM
    privateBalance: BigInt(20_000_000_000), // 2,000 XLM
    notes: [],
  },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const ClientsService = {
  async getAll(): Promise<Client[]> {
    await delay(300);
    return [...MOCK_CLIENTS];
  },

  async getById(id: string): Promise<Client | null> {
    await delay(150);
    return MOCK_CLIENTS.find((c) => c.id === id) ?? null;
  },

  async transferPublic(
    clientId: string,
    destinationAddress: string,
    amount: bigint
  ): Promise<{ txHash: string; success: boolean }> {
    await delay(1500);
    // Mock: update client balance
    const client = MOCK_CLIENTS.find((c) => c.id === clientId);
    if (client) {
      client.publicBalance -= amount;
    }
    return {
      txHash: `mock_transfer_${Date.now().toString(16)}`,
      success: true,
    };
  },

  async depositToPrivate(
    clientId: string,
    amount: bigint
  ): Promise<{ txHash: string; noteId: string; success: boolean }> {
    await delay(1500);
    // Mock: move from public to private
    const client = MOCK_CLIENTS.find((c) => c.id === clientId);
    if (client) {
      client.publicBalance -= amount;
      client.privateBalance += amount;
    }
    return {
      txHash: `mock_deposit_${Date.now().toString(16)}`,
      noteId: `note-${Date.now()}`,
      success: true,
    };
  },

  async transferPrivate(
    clientId: string,
    destinationAddress: string,
    amount: bigint
  ): Promise<{ txHash: string; success: boolean }> {
    await delay(2000);
    // Mock: reduce private balance
    const client = MOCK_CLIENTS.find((c) => c.id === clientId);
    if (client) {
      client.privateBalance -= amount;
    }
    return {
      txHash: `mock_private_transfer_${Date.now().toString(16)}`,
      success: true,
    };
  },
};
