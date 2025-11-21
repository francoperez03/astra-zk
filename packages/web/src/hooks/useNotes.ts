"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotesService } from "@/services/notes";
import type { Note, NoteStatus } from "@astra/sdk";

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: () => NotesService.getAll(),
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: () => NotesService.getById(id),
    enabled: !!id,
  });
}

export function useNotesByStatus(status: NoteStatus) {
  return useQuery({
    queryKey: ["notes", "status", status],
    queryFn: () => NotesService.getByStatus(status),
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: Note) => NotesService.save(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: NoteStatus }) =>
      NotesService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => NotesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function usePrivateBalance() {
  const { data: notes } = useNotes();

  const balance =
    notes
      ?.filter((n) => n.status === "deposited")
      .reduce((sum, n) => sum + n.amount, BigInt(0)) ?? BigInt(0);

  return balance;
}
