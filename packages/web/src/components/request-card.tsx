"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatAddress, cn } from "@/lib/utils";
import type { ViewingKeyRequest, RequestStatus } from "@/services/regulator";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar,
  FileText,
} from "lucide-react";

interface RequestCardProps {
  request: ViewingKeyRequest;
}

const statusConfig: Record<
  RequestStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    color: "bg-gray-100 text-gray-800",
    icon: AlertCircle,
  },
};

export function RequestCard({ request }: RequestCardProps) {
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  // Get initials from client name
  const initials = request.clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatBlockRange = () => {
    if (!request.startBlock && !request.endBlock) {
      return "No block restriction";
    }
    if (request.startBlock && request.endBlock) {
      return `Blocks ${request.startBlock.toLocaleString()} - ${request.endBlock.toLocaleString()}`;
    }
    if (request.startBlock) {
      return `From block ${request.startBlock.toLocaleString()}`;
    }
    return `To block ${request.endBlock?.toLocaleString()}`;
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        {/* Header: Client + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {initials}
              </span>
            </div>

            {/* Client info */}
            <div>
              <h3 className="font-semibold">{request.clientName}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {formatAddress(request.clientAddress, 6)}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              status.color
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </div>
        </div>

        {/* Block range */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Eye className="h-4 w-4" />
          <span>{formatBlockRange()}</span>
        </div>

        {/* Justification */}
        <div className="bg-secondary/50 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <FileText className="h-3 w-3" />
            <span>Justification</span>
          </div>
          <p className="text-sm line-clamp-2">{request.justification}</p>
        </div>

        {/* Footer: Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Created {formatDate(request.createdAt)}</span>
        </div>

        {/* Viewing Key (if approved) */}
        {request.status === "approved" && request.viewingKey && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Eye className="h-3 w-3" />
              <span>Viewing Key</span>
            </div>
            <p className="text-xs font-mono bg-green-50 text-green-800 p-2 rounded break-all">
              {request.viewingKey}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
