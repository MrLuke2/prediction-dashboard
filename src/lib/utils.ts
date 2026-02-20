import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge tailwind classes with clsx logic.
 * Ensures consistent class merging and prevents conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: Date | string | number): string {
  const now = new Date().getTime();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
