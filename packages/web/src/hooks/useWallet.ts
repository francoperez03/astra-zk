"use client";

import { useState, useCallback, useEffect } from "react";
import {
  isConnected,
  isAllowed,
  setAllowed,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  network: "testnet" | "mainnet";
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    network: "testnet",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await isConnected();
      if (connected) {
        const allowed = await isAllowed();
        if (allowed) {
          const publicKey = await getPublicKey();
          setState((prev) => ({ ...prev, connected: true, publicKey }));
        }
      }
    } catch (err) {
      console.error("Failed to check wallet connection:", err);
    }
  };

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const connected = await isConnected();
      if (!connected) {
        throw new Error("Freighter not found. Please install the extension.");
      }

      await setAllowed();
      const publicKey = await getPublicKey();

      setState((prev) => ({ ...prev, connected: true, publicKey }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ connected: false, publicKey: null, network: "testnet" });
  }, []);

  const sign = useCallback(async (txXdr: string): Promise<string> => {
    if (!state.connected) {
      throw new Error("Wallet not connected");
    }

    const signedTx = await signTransaction(txXdr, {
      networkPassphrase:
        state.network === "mainnet"
          ? "Public Global Stellar Network ; September 2015"
          : "Test SDF Network ; September 2015",
    });

    return signedTx;
  }, [state.connected, state.network]);

  return {
    ...state,
    connect,
    disconnect,
    sign,
    isLoading,
    error,
  };
}
