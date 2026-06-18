import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toExternalUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  return `https://${trimmed}`
}

export function toInstagramUrl(handle: string): string {
  const trimmed = handle.trim()
  if (/instagram\.com/i.test(trimmed)) {
    return toExternalUrl(trimmed)
  }
  const username = trimmed.replace(/^@/, "")
  return `https://instagram.com/${username}`
}
