import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const colorMap = {
  red: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    icon: "text-red-600",
    value: "text-red-700",
  },
  orange: {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    icon: "text-orange-600",
    value: "text-orange-700",
  },
  blue: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    value: "text-blue-700",
  },
  yellow: {
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    icon: "text-amber-600",
    value: "text-amber-700",
  },
  purple: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    icon: "text-purple-600",
    value: "text-purple-700",
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

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border-l-4 bg-white p-5 shadow-sm transition hover:shadow-md",
        colors.border,
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("rounded-lg p-2", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-gray-500">{titulo}</p>
        <p className={cn("mt-1 text-3xl font-bold", colors.value)}>{valor}</p>
      </div>

      <Link
        to={href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-gray-800"
      >
        Ver todos
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
