import type { KeyboardEvent, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface ListRecordField {
  label: string
  value: ReactNode
}

interface ListRecordProps {
  title: ReactNode
  fields?: ListRecordField[]
  onClick?: () => void
  actions?: ReactNode
  primaryAction?: ReactNode
  children?: ReactNode
  className?: string
}

export default function ListRecord({
  title,
  fields,
  onClick,
  actions,
  primaryAction,
  children,
  className,
}: ListRecordProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <article className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-border", className)}>
      <div
        className={cn("p-4", onClick && "cursor-pointer")}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick ? onKeyDown : undefined}
      >
        <div className="font-medium text-foreground">{title}</div>
        {fields && fields.length > 0 ? (
          <dl className="mt-3 space-y-2">
            {fields.map((field) => (
              <div key={field.label} className="flex items-start justify-between gap-3 text-sm">
                <dt className="shrink-0 text-muted-foreground">{field.label}</dt>
                <dd className="min-w-0 text-right text-foreground">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {children ? <div className="border-t border-border">{children}</div> : null}
      {actions || primaryAction ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-2.5 py-3">
          {actions ? <div className="flex min-w-0 flex-wrap gap-2">{actions}</div> : null}
          {primaryAction ? <div className="ml-auto shrink-0">{primaryAction}</div> : null}
        </div>
      ) : null}
    </article>
  )
}
