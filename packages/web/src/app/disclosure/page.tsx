"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotes } from "@/hooks/useNotes";
import { formatUSDT } from "@/lib/utils";
import { Loader2, FileDown, Check } from "lucide-react";

export default function DisclosurePage() {
  const { data: notes, isLoading } = useNotes();

  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const availableNotes = notes?.filter((n) => n.status === "deposited" || n.status === "withdrawn") ?? [];

  const toggleNote = (noteId: string) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const selectedTotal = availableNotes
    .filter((n) => selectedNotes.has(n.id))
    .reduce((sum, n) => sum + n.amount, BigInt(0));

  const handleGeneratePackage = async () => {
    if (selectedNotes.size === 0 || !recipientAddress) return;

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);

    alert(`Disclosure package generated for ${selectedNotes.size} notes`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Selective Disclosure</h1>

      {availableNotes.length === 0 ? (
        <p className="text-muted-foreground">No transactions available</p>
      ) : (
        <div className="space-y-4">
          {/* Transaction List */}
          <Card>
            <CardContent className="p-0 divide-y">
              {availableNotes.map((note) => (
                <div
                  key={note.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    selectedNotes.has(note.id) ? "bg-primary/5" : "hover:bg-secondary/50"
                  }`}
                  onClick={() => toggleNote(note.id)}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedNotes.has(note.id)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {selectedNotes.has(note.id) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium">{formatUSDT(note.amount)} asUSDT</span>
                    <span className="text-xs text-muted-foreground">
                      {note.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Selected: {selectedNotes.size}
              </span>
              <span className="font-medium">{formatUSDT(selectedTotal)} asUSDT</span>
            </div>

            <Input
              placeholder="Recipient address (G...)"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />

            <Button
              className="w-full gap-2"
              onClick={handleGeneratePackage}
              disabled={selectedNotes.size === 0 || !recipientAddress || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              Generate Package
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
