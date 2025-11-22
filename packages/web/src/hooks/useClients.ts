"use client";

import { useState, useCallback, useEffect } from "react";
import { ClientsService, type Client } from "@/services/clients";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ClientsService.getAll();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const transferPublic = useCallback(
    async (clientId: string, destination: string, amount: bigint) => {
      const result = await ClientsService.transferPublic(
        clientId,
        destination,
        amount
      );
      if (result.success) {
        await fetchClients(); // Refresh data
      }
      return result;
    },
    [fetchClients]
  );

  const depositToPrivate = useCallback(
    async (clientId: string, amount: bigint) => {
      const result = await ClientsService.depositToPrivate(clientId, amount);
      if (result.success) {
        await fetchClients(); // Refresh data
      }
      return result;
    },
    [fetchClients]
  );

  const transferPrivate = useCallback(
    async (clientId: string, destination: string, amount: bigint) => {
      const result = await ClientsService.transferPrivate(
        clientId,
        destination,
        amount
      );
      if (result.success) {
        await fetchClients(); // Refresh data
      }
      return result;
    },
    [fetchClients]
  );

  return {
    clients,
    isLoading,
    error,
    refetch: fetchClients,
    transferPublic,
    depositToPrivate,
    transferPrivate,
  };
}
