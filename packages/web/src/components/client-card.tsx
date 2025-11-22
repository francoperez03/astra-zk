"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatXLM, formatAddress, cn } from "@/lib/utils";
import type { Client } from "@/services/clients";
import {
  ArrowUpRight,
  ArrowDownToLine,
  Lock,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";

interface ClientCardProps {
  client: Client;
  onTransferPublic: (client: Client) => void;
  onDepositPrivate: (client: Client) => void;
  onTransferPrivate: (client: Client) => void;
}

export function ClientCard({
  client,
  onTransferPublic,
  onDepositPrivate,
  onTransferPrivate,
}: ClientCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Get initials from name
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        {/* Header: Avatar + Name + Expand */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {initials}
              </span>
            </div>

            {/* Name & Address */}
            <div>
              <h3 className="font-semibold">{client.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {formatAddress(client.stellarAddress, 6)}
              </p>
            </div>
          </div>

          {/* Expand toggle */}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Balances */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Public Balance */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <User className="h-3 w-3" />
              <span>Public</span>
            </div>
            <p className="text-lg font-semibold">
              {formatXLM(client.publicBalance)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                XLM
              </span>
            </p>
          </div>

          {/* Private Balance */}
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Lock className="h-3 w-3" />
              <span>Private</span>
            </div>
            <p className="text-lg font-semibold">
              {formatXLM(client.privateBalance)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                XLM
              </span>
            </p>
          </div>
        </div>

        {/* Expanded Actions */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            expanded ? "mt-4 max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Actions</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTransferPublic(client);
                }}
                disabled={client.publicBalance <= BigInt(0)}
              >
                <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
                Transfer Public
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDepositPrivate(client);
                }}
                disabled={client.publicBalance <= BigInt(0)}
              >
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                Deposit
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTransferPrivate(client);
                }}
                disabled={client.privateBalance <= BigInt(0)}
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Transfer Private
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
