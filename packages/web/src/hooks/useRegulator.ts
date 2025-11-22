"use client";

import { useState, useCallback, useEffect } from "react";
import {
  RegulatorService,
  type ViewingKeyRequest,
  type CreateRequestParams,
} from "@/services/regulator";

export function useRegulator() {
  const [requests, setRequests] = useState<ViewingKeyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, statsData] = await Promise.all([
        RegulatorService.getAll(),
        RegulatorService.getStats(),
      ]);
      setRequests(data);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = useCallback(
    async (params: CreateRequestParams) => {
      const result = await RegulatorService.create(params);
      await fetchRequests(); // Refresh data
      return result;
    },
    [fetchRequests]
  );

  return {
    requests,
    stats,
    isLoading,
    error,
    refetch: fetchRequests,
    createRequest,
  };
}
