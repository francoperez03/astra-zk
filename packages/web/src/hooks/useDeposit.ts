"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { astra, DEFAULT_POOL } from "@/lib/astra";
import { NotesService } from "@/services/notes";
import { useWallet } from "./useWallet";

type DepositStep = "idle" | "generating" | "signing" | "submitting" | "done" | "error";

export function useDeposit() {
  const [step, setStep] = useState<DepositStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { publicKey, sign } = useWallet();

  const deposit = useMutation({
    mutationFn: async (amountXLM: number) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setError(null);
      const amountStroops = BigInt(Math.floor(amountXLM * 10_000_000));

      // 1. Generate note via SDK
      setStep("generating");
      const note = await astra.generateNote({
        privateKey: publicKey, // In real impl: derive from user secret
        amount: amountStroops,
        poolAddress: DEFAULT_POOL,
      });

      // 2. Sign transaction
      setStep("signing");
      const signTransaction = async (xdr: string) => {
        const signed = await sign(xdr);
        return signed;
      };

      // 3. Submit deposit via SDK
      setStep("submitting");
      const result = await astra.deposit({
        commitment: note.commitment,
        amount: note.amount,
        signTransaction,
      });

      // 4. Save note locally
      note.leafIndex = result.leafIndex;
      note.depositTxHash = result.txHash;
      note.status = "deposited";
      await NotesService.save(note);

      setStep("done");
      return note;
    },
    onError: (err) => {
      setStep("error");
      setError(err instanceof Error ? err.message : "Deposit failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const reset = () => {
    setStep("idle");
    setError(null);
    deposit.reset();
  };

  return {
    deposit: deposit.mutate,
    depositAsync: deposit.mutateAsync,
    step,
    error,
    isLoading: deposit.isPending,
    isSuccess: deposit.isSuccess,
    note: deposit.data,
    reset,
  };
}
