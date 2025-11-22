"use client";

import { useState } from "react";
import { useClients } from "@/hooks/useClients";
import { ClientCard } from "@/components/client-card";
import { ActionModal, type ActionType } from "@/components/action-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Client } from "@/services/clients";
import { Search, Users, Loader2, RefreshCw } from "lucide-react";
import { formatXLM } from "@/lib/utils";

export default function AnchorPage() {
  const {
    clients,
    isLoading,
    error,
    refetch,
    transferPublic,
    depositToPrivate,
    transferPrivate,
  } = useClients();

  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  // Filter clients by search
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.stellarAddress.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate totals
  const totalPublic = clients.reduce((sum, c) => sum + c.publicBalance, BigInt(0));
  const totalPrivate = clients.reduce((sum, c) => sum + c.privateBalance, BigInt(0));

  const handleAction = (client: Client, action: ActionType) => {
    setSelectedClient(client);
    setActionType(action);
  };

  const handleSubmit = async (amount: bigint, destination?: string) => {
    if (!selectedClient || !actionType) return;

    switch (actionType) {
      case "transfer-public":
        await transferPublic(selectedClient.id, destination!, amount);
        break;
      case "deposit-private":
        await depositToPrivate(selectedClient.id, amount);
        break;
      case "transfer-private":
        await transferPrivate(selectedClient.id, destination!, amount);
        break;
    }
  };

  const closeModal = () => {
    setSelectedClient(null);
    setActionType(null);
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch}>Reintentar</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel Anchor</h1>
        <p className="text-muted-foreground">
          Gestiona los balances públicos y privados de tus clientes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span>Total Clientes</span>
          </div>
          <p className="text-2xl font-bold">{clients.length}</p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Balance Público Total</p>
          <p className="text-2xl font-bold">
            {formatXLM(totalPublic)}{" "}
            <span className="text-base font-normal text-muted-foreground">XLM</span>
          </p>
        </div>

        <div className="bg-primary/5 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Balance Privado Total</p>
          <p className="text-2xl font-bold">
            {formatXLM(totalPrivate)}{" "}
            <span className="text-base font-normal text-muted-foreground">XLM</span>
          </p>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? "No se encontraron clientes" : "No hay clientes registrados"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onTransferPublic={(c) => handleAction(c, "transfer-public")}
              onDepositPrivate={(c) => handleAction(c, "deposit-private")}
              onTransferPrivate={(c) => handleAction(c, "transfer-private")}
            />
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedClient && actionType && (
        <ActionModal
          client={selectedClient}
          actionType={actionType}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
