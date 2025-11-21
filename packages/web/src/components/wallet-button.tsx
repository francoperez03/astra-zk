"use client";

import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/utils";

export function WalletButton() {
  const { publicKey, connect, disconnect, isLoading } = useWallet();

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {formatAddress(publicKey, 6)}
        </span>
        <Button variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} disabled={isLoading}>
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
