import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const colorMap = {
  red: {
    well: "bg-red-50 text-red-700",
    value: "text-red-700",
    edge: "border-t-red-500",
  },
  orange: {
    well: "bg-orange-50 text-orange-700",
    value: "text-orange-700",
    edge: "border-t-orange-500",
  },
  blue: {
    well: "bg-sky-50 text-sky-700",
    value: "text-sky-800",
    edge: "border-t-sky-500",
  },
  yellow: {
    well: "bg-amber-50 text-amber-800",
    value: "text-amber-800",
    edge: "border-t-amber-500",
  },
  purple: {
    well: "bg-violet-50 text-violet-700",
    value: "text-violet-800",
    edge: "border-t-violet-500",
  },
} as const

export type AlertaColor = keyof typeof colorMap

interface AlertaCardProps {
  titulo: string
  valor: number
  icone: LucideIcon
  cor: AlertaColor
  href: string
}

export default function AlertaCard({ titulo, valor, icone: Icon, cor, href }: AlertaCardProps) {
  const colors = colorMap[cor]
  const needsAction = valor > 0

  return (
    <Link
      to={href}
      className={cn(
        "group flex min-h-40 flex-col justify-between rounded-2xl border-t-4 bg-card p-5 ring-1 ring-border",
        "shadow-[0_1px_2px_hsl(150_20%_10%/0.04)]",
        "transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_hsl(150_20%_10%/0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "active:translate-y-0",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        needsAction ? colors.edge : "border-t-transparent",
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-xl",
          needsAction ? colors.well : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>

      <span className="mt-4 block">
        <span className="block text-sm font-medium text-muted-foreground">{titulo}</span>
        <span
          className={cn(
            "mt-1 block text-3xl font-semibold tabular-nums tracking-tight",
            needsAction ? colors.value : "text-foreground",
          )}
        >
          {valor}
        </span>
      </span>

      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
        {needsAction ? "Resolver" : "Abrir lista"}
        <ChevronRight
          className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
          aria-hidden="true"
        />
      </span>
    </Link>
  )
}
