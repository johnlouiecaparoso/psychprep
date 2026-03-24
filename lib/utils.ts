import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function getReadiness(score: number) {
  if (score >= 85) {
    return { label: "Ready", tone: "text-emerald-600" };
  }

  if (score >= 70) {
    return { label: "Almost there", tone: "text-amber-600" };
  }

  return { label: "Needs more review", tone: "text-rose-600" };
}
