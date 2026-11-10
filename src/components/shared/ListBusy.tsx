import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ListBusyProps {
  busy?: boolean
  className?: string
  children: ReactNode
}

export default function ListBusy({ busy = false, className, children }: ListBusyProps) {
  return (
    <div className="relative" aria-busy={busy || undefined}>
      {busy ? (
        <div
          className="pointer-events-none absolute inset-x-[calc(var(--radius)*1.8+0.25rem)] top-0 z-10 h-0.5 animate-pulse bg-muted-foreground/40"
          aria-hidden="true"
        />
      ) : null}
      <div className={cn(className, busy && "opacity-60")}>{children}</div>
    </div>
  )
}
