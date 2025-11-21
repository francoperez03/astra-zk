"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@astra/sdk";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteCard } from "@/components/note-card";
import { useNotesByStatus } from "@/hooks/useNotes";
import { useWithdraw } from "@/hooks/useWithdraw";
import { formatXLM } from "@/lib/utils";
import { Check, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

const STEP_MESSAGES = {
  idle: "",
  computing: "Computing nullifier...",
  proving: "Generating zero-knowledge proof...",
  submitting: "Submitting withdrawal...",
  done: "Withdrawal complete!",
  error: "Something went wrong",
};

export default function WithdrawPage() {
  const router = useRouter();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [recipient, setRecipient] = useState("");
  const { data: notes, isLoading: notesLoading } = useNotesByStatus("deposited");
  const { withdraw, step, error, isLoading, isSuccess, result, reset } = useWithdraw();

  const handleWithdraw = () => {
    if (!selectedNote || !recipient) return;
    withdraw({ note: selectedNote, recipient });
  };

  const isValidRecipient = recipient.length === 56 && recipient.startsWith("G");

  if (isSuccess && result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Withdrawal Successful</CardTitle>
            <CardDescription>
              Your funds have been sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatXLM(result.note.amount)} XLM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-mono text-xs">{recipient.slice(0, 8)}...{recipient.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tx Hash</span>
                <span className="font-mono text-xs">{result.txHash.slice(0, 12)}...</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset();
                setSelectedNote(null);
                setRecipient("");
              }}
            >
              Withdraw More
            </Button>
            <Button className="flex-1" onClick={() => router.push("/notes")}>
              View Notes
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Step 1: Select note
  if (!selectedNote) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Withdraw</CardTitle>
            <CardDescription>
              Select a note to withdraw
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !notes?.length ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No notes available for withdrawal
                </p>
                <Button variant="outline" onClick={() => router.push("/deposit")}>
                  Make a Deposit
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => setSelectedNote(note)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Enter recipient
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 mb-2"
            onClick={() => setSelectedNote(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <CardTitle>Withdraw {formatXLM(selectedNote.amount)} XLM</CardTitle>
          <CardDescription>
            Enter the recipient address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Address</label>
            <Input
              placeholder="G..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="font-mono"
            />
            {recipient && !isValidRecipient && (
              <p className="text-xs text-destructive">
                Invalid Stellar address
              </p>
            )}
          </div>

          {step !== "idle" && step !== "done" && (
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              {step === "error" ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
              <span className="text-sm">{STEP_MESSAGES[step]}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleWithdraw}
            disabled={!isValidRecipient || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Withdraw"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
