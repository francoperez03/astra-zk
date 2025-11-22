"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/note-card";
import { useNotes, usePrivateBalance } from "@/hooks/useNotes";
import { formatXLM } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

export default function NotesPage() {
  const router = useRouter();
  const { data: notes, isLoading } = useNotes();
  const privateBalance = usePrivateBalance();

  const sortedNotes = notes?.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Your Notes</h1>
          <p className="text-muted-foreground">
            Private balance: <span className="font-semibold text-foreground">{formatXLM(privateBalance)} XLM</span>
          </p>
        </div>
        <Link
          href="/deposit"
          className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Deposit
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !sortedNotes?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any notes yet
            </p>
            <Button onClick={() => router.push("/deposit")}>
              Make Your First Deposit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Active notes */}
          {sortedNotes.filter((n) => n.status === "deposited").length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Available
              </h2>
              {sortedNotes
                .filter((n) => n.status === "deposited")
                .map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => router.push("/withdraw")}
                  />
                ))}
            </div>
          )}

          {/* Pending notes */}
          {sortedNotes.filter((n) => n.status === "pending" || n.status === "withdrawing").length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Pending
              </h2>
              {sortedNotes
                .filter((n) => n.status === "pending" || n.status === "withdrawing")
                .map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
            </div>
          )}

          {/* History */}
          {sortedNotes.filter((n) => n.status === "withdrawn" || n.status === "failed").length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                History
              </h2>
              {sortedNotes
                .filter((n) => n.status === "withdrawn" || n.status === "failed")
                .map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
