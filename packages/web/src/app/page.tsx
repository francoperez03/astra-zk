"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { usePrivateBalance, useNotes } from "@/hooks/useNotes";
import { useWallet } from "@/hooks/useWallet";
import { formatXLM } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine, Shield, Zap, Lock } from "lucide-react";

export default function Home() {
  const { publicKey } = useWallet();
  const privateBalance = usePrivateBalance();
  const { data: notes } = useNotes();
  const activeNotes = notes?.filter((n) => n.status === "deposited").length ?? 0;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-5xl font-bold text-primary mb-4">ASTRA</h1>
        <p className="text-xl text-muted-foreground">
          Privacy-preserving transactions on Stellar using zero-knowledge proofs
        </p>
      </div>

      {/* Balance Card (when connected) */}
      {publicKey && (
        <Card className="max-w-md mx-auto mb-12">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Private Balance</p>
              <p className="text-4xl font-bold mb-1">{formatXLM(privateBalance)} XLM</p>
              <p className="text-sm text-muted-foreground">{activeNotes} active note{activeNotes !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <Link
                href="/deposit"
                className="flex-1 inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Deposit
              </Link>
              <Link
                href="/withdraw"
                className="flex-1 inline-flex items-center justify-center h-10 px-4 rounded-md border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium"
              >
                <ArrowUpFromLine className="w-4 h-4 mr-2" />
                Withdraw
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA (when not connected) */}
      {!publicKey && (
        <div className="flex gap-4 justify-center mb-16">
          <Link
            href="/deposit"
            className="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            Deposit
          </Link>
          <Link
            href="/withdraw"
            className="inline-flex items-center justify-center h-11 px-8 rounded-md border border-border bg-background hover:bg-secondary transition-colors text-sm font-medium"
          >
            <ArrowUpFromLine className="w-4 h-4 mr-2" />
            Withdraw
          </Link>
        </div>
      )}

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Private</h3>
            <p className="text-sm text-muted-foreground">
              Break the link between sender and receiver using zero-knowledge proofs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Fast</h3>
            <p className="text-sm text-muted-foreground">
              Built on Stellar for near-instant finality and minimal fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Secure</h3>
            <p className="text-sm text-muted-foreground">
              Your private notes are encrypted and stored locally on your device
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
