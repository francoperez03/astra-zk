"use client";

import { useQuery } from "@tanstack/react-query";
import { astra, DEFAULT_POOL } from "@/lib/astra";

export function usePool(poolAddress: string = DEFAULT_POOL) {
  return useQuery({
    queryKey: ["pool", poolAddress],
    queryFn: () => astra.getPoolInfo(poolAddress),
    staleTime: 30_000,
  });
}

export function useMerklePath(poolAddress: string, leafIndex: number | undefined) {
  return useQuery({
    queryKey: ["merkle", poolAddress, leafIndex],
    queryFn: () => astra.getMerklePath(poolAddress, leafIndex!),
    enabled: leafIndex !== undefined,
  });
}

export function useIsSpent(poolAddress: string, nullifier: string | undefined) {
  return useQuery({
    queryKey: ["spent", poolAddress, nullifier],
    queryFn: () => astra.isSpent(poolAddress, nullifier!),
    enabled: !!nullifier,
  });
}
