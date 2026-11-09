import type { ComponentProps, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ListRecordTone = "neutral" | "danger" | "warning" | "success"

const toneClass: Record<Exclude<ListRecordTone, "neutral">, string> = {
  danger:
    "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground",
  warning: "border-amber-600 bg-amber-500 text-white hover:bg-amber-600 hover:text-white",
  success: "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white",
}

interface ListRecordButtonProps extends Omit<ComponentProps<typeof Button>, "variant" | "children"> {
  icon: LucideIcon
  tone?: ListRecordTone
  children: ReactNode
}

export default function ListRecordButton({
  icon: Icon,
  tone = "neutral",
  className,
  children,
  type = "button",
  ...props
}: ListRecordButtonProps) {
  return (
    <Button
      type={type}
      variant="outline"
      className={cn("min-h-11 px-1.5", tone !== "neutral" && toneClass[tone], className)}
      {...props}
    >
      <Icon aria-hidden="true" />
      {children}
    </Button>
  )
}
