"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Note } from "@astra/sdk";
import { astra, DEFAULT_POOL } from "@/lib/astra";
import { NotesService } from "@/services/notes";
import { useWallet } from "./useWallet";

type WithdrawStep = "idle" | "computing" | "proving" | "submitting" | "done" | "error";

export function useWithdraw() {
  const [step, setStep] = useState<WithdrawStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { sign } = useWallet();

  const withdraw = useMutation({
    mutationFn: async ({ note, recipient }: { note: Note; recipient: string }) => {
      setError(null);

      // 1. Compute nullifier via SDK
      setStep("computing");
      const nullifier = astra.computeNullifier(note);

      // Check if already spent
      const isSpent = await astra.isSpent(DEFAULT_POOL, nullifier);
      if (isSpent) {
        throw new Error("Note has already been spent");
      }

      // 2. Get merkle path and generate proof via SDK
      setStep("proving");
      const merklePath = await astra.getMerklePath(DEFAULT_POOL, note.leafIndex!);
      const proof = await astra.generateProof({ note, recipient, merklePath });

      // 3. Mark as withdrawing
      await NotesService.updateStatus(note.id, "withdrawing");

      // 4. Submit withdrawal via SDK
      setStep("submitting");
      const signTransaction = async (xdr: string) => sign(xdr);
      const result = await astra.withdraw({
        nullifier,
        recipient,
        proof,
        signTransaction,
      });

      // 5. Mark as withdrawn
      const updatedNote: Note = {
        ...note,
        nullifier,
        withdrawTxHash: result.txHash,
        status: "withdrawn",
      };
      await NotesService.save(updatedNote);

      setStep("done");
      return { note: updatedNote, txHash: result.txHash };
    },
    onError: async (err, { note }) => {
      setStep("error");
      setError(err instanceof Error ? err.message : "Withdrawal failed");
      await NotesService.updateStatus(note.id, "deposited");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const reset = () => {
    setStep("idle");
    setError(null);
    withdraw.reset();
  };

  return {
    withdraw: withdraw.mutate,
    withdrawAsync: withdraw.mutateAsync,
    step,
    error,
    isLoading: withdraw.isPending,
    isSuccess: withdraw.isSuccess,
    result: withdraw.data,
    reset,
  };
}
