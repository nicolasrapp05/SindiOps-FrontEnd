import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const colorMap = {
  red: "text-red-600 bg-red-50",
  orange: "text-orange-600 bg-orange-50",
  blue: "text-sky-600 bg-sky-50",
  yellow: "text-amber-600 bg-amber-50",
  purple: "text-purple-600 bg-purple-50",
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
  const needsAction = valor > 0

  return (
    <Link
      to={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border shadow-[0_1px_2px_hsl(150_20%_10%/0.04)] sm:p-5",
        "transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
        "hover:-translate-y-0.5 hover:shadow-[0_10px_24px_hsl(150_20%_10%/0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <span
        className={cn(
          "shrink-0 rounded-lg p-2",
          needsAction ? colorMap[cor] : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-gray-500">{titulo}</span>
        <span className="block text-2xl font-bold tabular-nums text-foreground">{valor}</span>
      </span>
      <ChevronRight
        className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        aria-hidden="true"
      />
    </Link>
  )
}
