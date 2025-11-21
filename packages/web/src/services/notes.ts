import { get, set, del, keys } from "idb-keyval";
import type { Note, NoteStatus } from "@astra/sdk";

const NOTES_PREFIX = "astra:note:";

export const NotesService = {
  async getAll(): Promise<Note[]> {
    const allKeys = await keys();
    const noteKeys = allKeys.filter(
      (k) => typeof k === "string" && k.startsWith(NOTES_PREFIX)
    );

    const notes = await Promise.all(
      noteKeys.map(async (k) => {
        const data = await get<string>(k);
        if (!data) return null;
        return deserializeNote(data);
      })
    );

    return notes.filter((n): n is Note => n !== null);
  },

  async getById(id: string): Promise<Note | null> {
    const data = await get<string>(NOTES_PREFIX + id);
    if (!data) return null;
    return deserializeNote(data);
  },

  async save(note: Note): Promise<void> {
    await set(NOTES_PREFIX + note.id, serializeNote(note));
  },

  async updateStatus(id: string, status: NoteStatus): Promise<void> {
    const note = await this.getById(id);
    if (!note) throw new Error(`Note ${id} not found`);
    note.status = status;
    await this.save(note);
  },

  async delete(id: string): Promise<void> {
    await del(NOTES_PREFIX + id);
  },

  async getByStatus(status: NoteStatus): Promise<Note[]> {
    const all = await this.getAll();
    return all.filter((n) => n.status === status);
  },
};

function serializeNote(note: Note): string {
  return JSON.stringify({
    ...note,
    amount: note.amount.toString(),
    createdAt: note.createdAt.toISOString(),
  });
}

function deserializeNote(data: string): Note {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    amount: BigInt(parsed.amount),
    createdAt: new Date(parsed.createdAt),
  };
}
