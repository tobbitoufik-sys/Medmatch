import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function appName() {
  return process.env.NEXT_PUBLIC_APP_NAME || "MedMatch";
}

export function formatDate(input: string | null) {
  if (!input) return "Not published yet";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium"
  }).format(new Date(input));
}
