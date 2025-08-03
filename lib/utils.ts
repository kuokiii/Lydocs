import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to base64 encode a string
export function base64EncodeString(str: string): string {
  if (typeof window !== "undefined") {
    // Browser environment
    return btoa(unescape(encodeURIComponent(str)))
  } else {
    // Node.js environment (for API routes)
    return Buffer.from(str, "utf8").toString("base64")
  }
}
