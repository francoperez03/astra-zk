"use client";

import type { Note } from "@astra/sdk";
import { Card, CardContent } from "@/components/ui/card";
import { formatXLM, formatAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  deposited: "bg-green-100 text-green-800",
  withdrawing: "bg-blue-100 text-blue-800",
  withdrawn: "bg-gray-100 text-gray-800",
  failed: "bg-red-100 text-red-800",
};

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  selected?: boolean;
}

export function NoteCard({ note, onClick, selected }: NoteCardProps) {
  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:border-primary/50",
        selected && "border-primary ring-2 ring-primary/20",
        onClick && "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-semibold">
            {formatXLM(note.amount)} XLM
          </span>
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              statusColors[note.status]
            )}
          >
            {note.status}
          </span>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Commitment</span>
            <span className="font-mono">{formatAddress(note.commitment, 8)}</span>
          </div>
          {note.leafIndex !== undefined && (
            <div className="flex justify-between">
              <span>Leaf Index</span>
              <span>#{note.leafIndex}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Created</span>
            <span>{note.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
