"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/amount-input";
import { useWallet } from "@/hooks/useWallet";
import { useDeposit } from "@/hooks/useDeposit";
import { Check, Loader2, AlertCircle } from "lucide-react";

const STEP_MESSAGES = {
  idle: "",
  generating: "Generating private note...",
  signing: "Sign the transaction in your wallet...",
  submitting: "Submitting deposit to the pool...",
  done: "Deposit complete!",
  error: "Something went wrong",
};

export default function DepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const { publicKey, connect } = useWallet();
  const { deposit, step, error, isLoading, isSuccess, note, reset } = useDeposit();

  const handleDeposit = () => {
    const xlm = parseFloat(amount);
    if (isNaN(xlm) || xlm <= 0) return;
    deposit(xlm);
  };

  const isValidAmount = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  if (isSuccess && note) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Deposit Successful</CardTitle>
            <CardDescription>
              Your funds are now private
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{amount} XLM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Leaf Index</span>
                <span className="font-mono">#{note.leafIndex}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Deposited</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your private note has been saved locally. You can view it in the Notes section.
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset();
                setAmount("");
              }}
            >
              Deposit More
            </Button>
            <Button className="flex-1" onClick={() => router.push("/notes")}>
              View Notes
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Deposit</CardTitle>
          <CardDescription>
            Convert public XLM into a private note
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!publicKey ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Connect your wallet to deposit
              </p>
              <Button onClick={connect}>Connect Wallet</Button>
            </div>
          ) : (
            <>
              <AmountInput
                value={amount}
                onChange={setAmount}
                disabled={isLoading}
              />

              {step !== "idle" && step !== "done" && (
                <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                  {step === "error" ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  )}
                  <span className="text-sm">{STEP_MESSAGES[step]}</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </CardContent>
        {publicKey && (
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleDeposit}
              disabled={!isValidAmount || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Deposit"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
