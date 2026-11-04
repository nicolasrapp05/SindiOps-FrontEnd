import { ArrowDown, ArrowUp } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { SortDir } from "@/lib/list-sort"

interface SortableHeadProps {
  label: string
  column: string
  sort?: string
  dir?: SortDir
  onSort: (column: string) => void
  className?: string
  align?: "left" | "right"
}

export default function SortableHead({
  label,
  column,
  sort,
  dir,
  onSort,
  className,
  align = "left",
}: SortableHeadProps) {
  const active = sort === column && (dir === "asc" || dir === "desc")

  return (
    <TableHead
      className={className}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        className={cn(
          "inline-flex min-h-11 items-center gap-1 text-xs font-medium text-muted-foreground",
          align === "right" && "w-full justify-end",
        )}
        onClick={() => onSort(column)}
      >
        {label}
        {active && dir === "asc" ? <ArrowUp className="size-3.5" aria-hidden="true" /> : null}
        {active && dir === "desc" ? <ArrowDown className="size-3.5" aria-hidden="true" /> : null}
      </button>
    </TableHead>
  )
}
