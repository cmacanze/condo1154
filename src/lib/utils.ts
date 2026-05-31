import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Decimal from "decimal.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Converts Prisma Decimal objects to numbers so data is safe to pass
// from Server Components to Client Components.
export function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof Decimal) return data.toNumber() as unknown as T;
  if (data instanceof Date) return data as T;
  if (Array.isArray(data)) return data.map(serialize) as unknown as T;
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      out[k] = serialize(v);
    }
    return out as T;
  }
  return data;
}

export function formatMZN(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-MZ", {
    style: "currency",
    currency: "MZN",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatMonth(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-MZ", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getReferenceMonthDate(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export function generateReceiptNumber(): string {
  const year = new Date().getFullYear();
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  // 6-digit random → 1M space, still human-readable
  const rand = (arr[0] % 1_000_000).toString().padStart(6, "0");
  return `REC-${year}-${rand}`;
}
