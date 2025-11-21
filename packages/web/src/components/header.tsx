"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-primary">
            ASTRA
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/deposit"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Deposit
            </Link>
            <Link
              href="/withdraw"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Withdraw
            </Link>
            <Link
              href="/notes"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Notes
            </Link>
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
