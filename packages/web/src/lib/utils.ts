import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatXLM(stroops: bigint): string {
  const xlm = Number(stroops) / 10_000_000;
  return xlm.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 7,
  });
}

export function formatAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function stroopsToXLM(stroops: bigint): number {
  return Number(stroops) / 10_000_000;
}

export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.floor(xlm * 10_000_000));
}
