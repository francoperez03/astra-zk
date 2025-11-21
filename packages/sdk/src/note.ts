import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, randomBytes } from "@noble/hashes/utils";
import type { Note } from "./types.js";

// Placeholder for Poseidon2 - would need actual implementation
function poseidon2(inputs: bigint[]): bigint {
  // TODO: Use actual Poseidon2 implementation matching the circuit
  const combined = inputs.map((i) => i.toString()).join(",");
  const hash = sha256(new TextEncoder().encode(combined));
  return BigInt("0x" + bytesToHex(hash).slice(0, 62));
}

function account(privateKey: bigint): bigint {
  return poseidon2([privateKey]);
}

function commitment(owner: bigint, value: bigint, blinding: bigint): bigint {
  return poseidon2([owner, value, blinding]);
}

function nullifier(commitmentHash: bigint, blinding: bigint): bigint {
  return poseidon2([commitmentHash, blinding]);
}

export class NoteGenerator {
  /**
   * Generate a new note
   */
  async generate(params: {
    privateKey: string;
    amount: bigint;
    poolAddress: string;
  }): Promise<Note> {
    const privateKeyBigInt = BigInt("0x" + params.privateKey);
    const ownerAccount = account(privateKeyBigInt);
    const blinding = BigInt("0x" + bytesToHex(randomBytes(31)));

    const commitmentHash = commitment(ownerAccount, params.amount, blinding);

    return {
      id: crypto.randomUUID(),
      ownerAccount: ownerAccount.toString(16).padStart(64, "0"),
      blinding: blinding.toString(16).padStart(64, "0"),
      commitment: commitmentHash.toString(16).padStart(64, "0"),
      amount: params.amount,
      poolAddress: params.poolAddress,
      status: "pending",
      createdAt: new Date(),
    };
  }

  /**
   * Compute nullifier for a note
   */
  computeNullifier(note: Note): string {
    const commitmentBigInt = BigInt("0x" + note.commitment);
    const blindingBigInt = BigInt("0x" + note.blinding);
    const result = nullifier(commitmentBigInt, blindingBigInt);
    return result.toString(16).padStart(64, "0");
  }
}

export class NoteParser {
  /**
   * Parse note from base64 string
   */
  static parse(noteString: string): Note {
    const decoded = Buffer.from(noteString, "base64").toString("utf-8");
    const data = JSON.parse(decoded);
    return {
      ...data,
      amount: BigInt(data.amount),
      createdAt: new Date(data.createdAt),
    };
  }

  /**
   * Serialize note to base64 string
   */
  static serialize(note: Note): string {
    const data = {
      ...note,
      amount: note.amount.toString(),
      createdAt: note.createdAt.toISOString(),
    };
    return Buffer.from(JSON.stringify(data)).toString("base64");
  }
}
