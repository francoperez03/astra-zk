"use client";

import { useState } from "react";
import { useRegulator } from "@/hooks/useRegulator";
import { RequestCard } from "@/components/request-card";
import { RequestModal } from "@/components/request-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Client } from "@/services/clients";
import {
  Search,
  FileText,
  Loader2,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function RegulatorPage() {
  const { requests, stats, isLoading, error, refetch, createRequest } =
    useRegulator();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Filter requests by search
  const filteredRequests = requests.filter(
    (r) =>
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.clientAddress.toLowerCase().includes(search.toLowerCase()) ||
      r.justification.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateRequest = async (params: {
    client: Client;
    startBlock?: number;
    endBlock?: number;
    justification: string;
  }) => {
    await createRequest(params);
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Regulator Panel</h1>
          <p className="text-muted-foreground">
            Request viewing keys to audit clients
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span>Total Requests</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-yellow-700 mb-1">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span>Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-800">{stats.approved}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-red-700 mb-1">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </div>
          <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or justification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Request List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search
            ? "No requests found"
            : "No requests registered"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Request Modal */}
      {showModal && (
        <RequestModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateRequest}
        />
      )}
    </main>
  );
}
