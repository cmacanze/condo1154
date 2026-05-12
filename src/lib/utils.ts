import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const now = new Date();
  const year = now.getFullYear();
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const rand = (arr[0] % 100000).toString().padStart(5, "0");
  return `REC-${year}-${rand}`;
}
