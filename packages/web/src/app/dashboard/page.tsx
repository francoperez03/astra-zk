"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotes, usePrivateBalance } from "@/hooks/useNotes";
import { formatUSDT } from "@/lib/utils";
import {
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: notes, isLoading } = useNotes();
  const privateBalance = usePrivateBalance();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["available"]));

  const sortedNotes = notes?.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const availableNotes = sortedNotes?.filter((n) => n.status === "deposited") ?? [];
  const pendingNotes = sortedNotes?.filter((n) => n.status === "pending" || n.status === "withdrawing") ?? [];
  const historyNotes = sortedNotes?.filter((n) => n.status === "withdrawn" || n.status === "failed") ?? [];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const NotesList = ({
    notes,
    title,
    section,
    showAction = false
  }: {
    notes: typeof availableNotes;
    title: string;
    section: string;
    showAction?: boolean;
  }) => {
    if (notes.length === 0) return null;

    const isExpanded = expandedSections.has(section);
    const totalAmount = notes.reduce((sum, n) => sum + n.amount, BigInt(0));

    return (
      <div className="border rounded-lg">
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-muted-foreground">({notes.length})</span>
          </div>
          <span className="text-sm font-medium">{formatUSDT(totalAmount)} asUSDT</span>
        </button>

        {isExpanded && (
          <div className="border-t divide-y">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`flex items-center justify-between p-3 ${showAction ? "cursor-pointer hover:bg-secondary/30" : ""}`}
                onClick={showAction ? () => router.push("/withdraw") : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium">{formatUSDT(note.amount)} asUSDT</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {note.createdAt.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Balance Card */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
            <Shield className="w-5 h-5" />
            Private Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold">{formatUSDT(privateBalance)}</p>
              <p className="text-muted-foreground">asUSDT</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/deposit")} size="sm" className="gap-2">
                <ArrowDownToLine className="w-4 h-4" />
                Deposit
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/withdraw")}
                size="sm"
                className="gap-2"
                disabled={privateBalance === BigInt(0)}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/transfer")}
                size="sm"
                className="gap-2"
                disabled={privateBalance === BigInt(0)}
              >
                <Send className="w-4 h-4" />
                Transfer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Notes</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !sortedNotes?.length ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No notes yet. Deposit aUSDT to get started.
              </p>
              <Button onClick={() => router.push("/deposit")} size="sm">
                Deposit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <NotesList notes={availableNotes} title="Available" section="available" showAction />
            <NotesList notes={pendingNotes} title="Pending" section="pending" />
            <NotesList notes={historyNotes} title="History" section="history" />
          </div>
        )}
      </div>
    </div>
  );
}
