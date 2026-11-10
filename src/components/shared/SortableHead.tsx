import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import type { SortDir } from "@/lib/list-sort"
import { cn } from "@/lib/utils"

interface SortableHeadProps {
  label: string
  column: string
  sort?: string
  dir?: SortDir
  onSort: (column: string) => void
  className?: string
}

export default function SortableHead({
  label,
  column,
  sort,
  dir,
  onSort,
  className,
}: SortableHeadProps) {
  const active = sort === column && (dir === "asc" || dir === "desc")
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown

  return (
    <TableHead
      className={className}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className={cn(
          "flex h-full w-full min-w-0 items-center gap-1.5 text-left text-xs font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
        onClick={() => onSort(column)}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className={cn("whitespace-nowrap", active && "font-semibold")}>{label}</span>
      </button>
    </TableHead>
  )
}
