import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

const ROW_COUNT = 6

export function ListSkeletonCards({ rows = ROW_COUNT }: { rows?: number }) {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: rows }, (_, row) => (
        <article key={row} className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <Skeleton className="h-5 w-2/5" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </article>
      ))}
    </div>
  )
}

export function ListSkeletonRows({
  rows = ROW_COUNT,
  columns,
}: {
  rows?: number
  columns: number
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <TableRow key={row} className="hover:bg-transparent">
          {Array.from({ length: columns }, (_, column) => (
            <TableCell key={column}>
              <Skeleton className="h-10 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
