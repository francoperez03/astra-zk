"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/amount-input";
import { formatXLM, stroopsToXLM, xlmToStroops } from "@/lib/utils";
import type { Client } from "@/services/clients";
import {
  X,
  ArrowUpRight,
  ArrowDownToLine,
  Lock,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

export type ActionType = "transfer-public" | "deposit-private" | "transfer-private";

interface ActionModalProps {
  client: Client;
  actionType: ActionType;
  onClose: () => void;
  onSubmit: (amount: bigint, destination?: string) => Promise<void>;
}

const ACTION_CONFIG = {
  "transfer-public": {
    title: "Transfer Public",
    description: "Send XLM publicly to another account",
    icon: ArrowUpRight,
    balanceKey: "publicBalance" as const,
    needsDestination: true,
    buttonText: "Transfer",
    loadingText: "Transferring...",
  },
  "deposit-private": {
    title: "Deposit to Private",
    description: "Convert public XLM to private balance",
    icon: ArrowDownToLine,
    balanceKey: "publicBalance" as const,
    needsDestination: false,
    buttonText: "Deposit",
    loadingText: "Depositing...",
  },
  "transfer-private": {
    title: "Transfer Private",
    description: "Send XLM privately (ZK)",
    icon: Lock,
    balanceKey: "privateBalance" as const,
    needsDestination: true,
    buttonText: "Transfer Private",
    loadingText: "Generating proof...",
  },
};

export function ActionModal({
  client,
  actionType,
  onClose,
  onSubmit,
}: ActionModalProps) {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;
  const maxBalance = stroopsToXLM(client[config.balanceKey]);

  const handleSubmit = async () => {
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (amountNum > maxBalance) {
      setError("Amount exceeds available balance");
      return;
    }

    if (config.needsDestination && !destination.trim()) {
      setError("Enter a destination address");
      return;
    }

    if (config.needsDestination && !destination.startsWith("G")) {
      setError("Invalid Stellar address");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(xlmToStroops(amountNum), destination || undefined);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation error");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Operation Successful</h3>
            <p className="text-muted-foreground mb-4">
              {config.title} completed for {client.name}
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{client.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{config.description}</p>

          {/* Balance disponible */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="text-xl font-semibold">
              {formatXLM(client[config.balanceKey])}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                XLM
              </span>
            </p>
          </div>

          {/* Destination input */}
          {config.needsDestination && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination address</label>
              <Input
                placeholder="G..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={isLoading}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <AmountInput
              value={amount}
              onChange={setAmount}
              max={maxBalance}
              disabled={isLoading}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !amount}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {config.loadingText}
              </>
            ) : (
              <>
                <Icon className="h-4 w-4 mr-2" />
                {config.buttonText}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
