"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatAddress, cn } from "@/lib/utils";
import type { Client } from "@/services/clients";
import { ClientsService } from "@/services/clients";
import {
  X,
  Eye,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  Search,
} from "lucide-react";

interface RequestModalProps {
  onClose: () => void;
  onSubmit: (params: {
    client: Client;
    startBlock?: number;
    endBlock?: number;
    justification: string;
  }) => Promise<void>;
}

export function RequestModal({ onClose, onSubmit }: RequestModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const [startBlock, setStartBlock] = useState("");
  const [endBlock, setEndBlock] = useState("");
  const [justification, setJustification] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await ClientsService.getAll();
        setClients(data);
      } catch (err) {
        setError("Error loading clients");
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.stellarAddress.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedClient) {
      setError("Select a client");
      return;
    }
    if (!justification.trim()) {
      setError("Justification is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        client: selectedClient,
        startBlock: startBlock ? parseInt(startBlock) : undefined,
        endBlock: endBlock ? parseInt(endBlock) : undefined,
        justification: justification.trim(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = selectedClient && justification.trim() && !isSubmitting;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">New Request</h2>
                <p className="text-sm text-muted-foreground">
                  Request viewing key from a client
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Client selector */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Client *
              </label>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  disabled={loadingClients || isSubmitting}
                >
                  {loadingClients ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : selectedClient ? (
                    <span>
                      {selectedClient.name} -{" "}
                      {formatAddress(selectedClient.stellarAddress, 4)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Select client
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>

                {showClientDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-60 overflow-auto">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search client..."
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          className="pl-8 h-8"
                        />
                      </div>
                    </div>
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-secondary/50 flex items-center gap-2",
                          selectedClient?.id === client.id && "bg-secondary"
                        )}
                        onClick={() => {
                          setSelectedClient(client);
                          setShowClientDropdown(false);
                          setClientSearch("");
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatAddress(client.stellarAddress, 6)}
                          </p>
                        </div>
                      </button>
                    ))}
                    {filteredClients.length === 0 && (
                      <p className="text-sm text-muted-foreground p-3 text-center">
                        No clients found
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Block range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  From block (optional)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 1000000"
                  value={startBlock}
                  onChange={(e) => setStartBlock(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  To block (optional)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 2000000"
                  value={endBlock}
                  onChange={(e) => setEndBlock(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Justification */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Justification *
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Reason for viewing key request..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Success */}
            {isSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
                <Check className="h-4 w-4" />
                Request created successfully
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Created
                </>
              ) : (
                "Request Viewing Key"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
