import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ListPanelProps {
  children: ReactNode
  className?: string
}

export default function ListPanel({ children, className }: ListPanelProps) {
  return (
    <div className={cn("list-panel overflow-hidden rounded-2xl bg-card ring-1 ring-border", className)}>
      {children}
    </div>
  )
}
