import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return nome.slice(0, 2).toUpperCase() || "?"
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
