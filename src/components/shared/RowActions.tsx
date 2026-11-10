import type { LucideIcon } from "lucide-react"
import { MoreVertical } from "lucide-react"
import type { MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface RowAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
  hidden?: boolean
  appearance?: "icon" | "button"
  buttonClassName?: string
}

function stopRowClick(event: MouseEvent) {
  event.stopPropagation()
}

function ActionButton({ action }: { action: RowAction }) {
  const labeled = action.appearance === "button"
  const Icon = action.icon

  return (
    <Button
      type="button"
      variant={labeled ? "outline" : "ghost"}
      size={labeled ? "sm" : "icon"}
      className={cn(labeled && "h-8", action.buttonClassName)}
      aria-label={action.label}
      title={action.label}
      disabled={action.disabled}
      onClick={(event) => {
        stopRowClick(event)
        action.onClick()
      }}
    >
      <Icon className={labeled ? "mr-1.5 h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      {labeled ? action.label : null}
    </Button>
  )
}

export default function RowActions({
  items,
  collapse = false,
}: {
  items: RowAction[]
  collapse?: boolean
}) {
  const visible = items.filter((action) => !action.hidden)
  if (visible.length === 0) return null
  if (!collapse) return <ActionButton action={visible[0]} />

  return (
    <>
      <div className="row-actions-inline min-w-0 flex-nowrap items-center gap-1">
        {visible.map((action) => (
          <ActionButton key={action.label} action={action} />
        ))}
      </div>
      <div className="row-actions-menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Ações"
              onClick={stopRowClick}
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" onClick={stopRowClick}>
            {visible.map((action) => {
              const Icon = action.icon
              return (
                <DropdownMenuItem
                  key={action.label}
                  variant={action.destructive ? "destructive" : "default"}
                  disabled={action.disabled}
                  onSelect={(event) => {
                    event.stopPropagation()
                    action.onClick()
                  }}
                >
                  <Icon />
                  {action.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
