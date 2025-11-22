import type { Client } from "./clients";

export type RequestStatus = "pending" | "approved" | "rejected" | "expired";

export interface ViewingKeyRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  startBlock?: number;
  endBlock?: number;
  justification: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  // The viewing key (only present when approved)
  viewingKey?: string;
}

// Mock data for demo
const MOCK_REQUESTS: ViewingKeyRequest[] = [
  {
    id: "req-001",
    clientId: "client-001",
    clientName: "Juan Pérez",
    clientAddress: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOUJ3BXFFOBVEPQZ",
    startBlock: 1000000,
    endBlock: 1500000,
    justification: "Auditoría trimestral de cumplimiento AML/KYC",
    status: "approved",
    createdAt: new Date("2025-11-01T10:30:00Z"),
    updatedAt: new Date("2025-11-02T14:00:00Z"),
    viewingKey: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
  },
  {
    id: "req-002",
    clientId: "client-002",
    clientName: "María García",
    clientAddress: "GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR",
    justification: "Investigación de actividad sospechosa reportada",
    status: "pending",
    createdAt: new Date("2025-11-20T09:15:00Z"),
    updatedAt: new Date("2025-11-20T09:15:00Z"),
  },
  {
    id: "req-003",
    clientId: "client-003",
    clientName: "Carlos López",
    clientAddress: "GCFXHS4GXL6BVUCXBWXGTITROWLVYXQKQLF4YH5O5JT3YZXCYPAFBJZB",
    startBlock: 500000,
    justification: "Verificación de historial para solicitud de crédito",
    status: "rejected",
    createdAt: new Date("2025-11-15T16:45:00Z"),
    updatedAt: new Date("2025-11-16T11:30:00Z"),
  },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface CreateRequestParams {
  client: Client;
  startBlock?: number;
  endBlock?: number;
  justification: string;
}

export const RegulatorService = {
  async getAll(): Promise<ViewingKeyRequest[]> {
    await delay(300);
    return [...MOCK_REQUESTS].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  async getById(id: string): Promise<ViewingKeyRequest | null> {
    await delay(150);
    return MOCK_REQUESTS.find((r) => r.id === id) ?? null;
  },

  async create(params: CreateRequestParams): Promise<ViewingKeyRequest> {
    // Simulate proof generation (generate_pfp)
    await delay(1500);

    const newRequest: ViewingKeyRequest = {
      id: `req-${Date.now().toString(16)}`,
      clientId: params.client.id,
      clientName: params.client.name,
      clientAddress: params.client.stellarAddress,
      startBlock: params.startBlock,
      endBlock: params.endBlock,
      justification: params.justification,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    MOCK_REQUESTS.unshift(newRequest);
    return newRequest;
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    await delay(100);
    return {
      total: MOCK_REQUESTS.length,
      pending: MOCK_REQUESTS.filter((r) => r.status === "pending").length,
      approved: MOCK_REQUESTS.filter((r) => r.status === "approved").length,
      rejected: MOCK_REQUESTS.filter((r) => r.status === "rejected").length,
    };
  },
};
