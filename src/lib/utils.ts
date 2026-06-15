import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateChestNumber(categoryPrefix: string, count: number): string {
  const num = String(count + 1).padStart(3, "0");
  return `${categoryPrefix}${num}`;
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "Date not set"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "Date not set"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

export function formatTime(date: string | Date | null | undefined) {
  if (!date) return "Time not set"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "Time not set"
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function calculatePosition(
  score: number,
  allScores: number[]
): string {
  const sorted = [...new Set(allScores)].sort((a, b) => b - a);
  const index = sorted.indexOf(score);
  if (index === 0) return "1st";
  if (index === 1) return "2nd";
  if (index === 2) return "3rd";
  return `${index + 1}th`;
}

export function calculatePoints(
  position: number,
  pointSystem: { first: number; second: number; third: number; participation: number }
): number {
  if (position === 1) return pointSystem.first;
  if (position === 2) return pointSystem.second;
  if (position === 3) return pointSystem.third;
  return pointSystem.participation;
}

export function getCategoryPrefix(categoryName: string): string {
  const words = categoryName.split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return words.map((w) => w[0]).join("").toUpperCase();
}
