import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ListPaginationProps {
  page: number
  totalPages: number
  onPage: (page: number) => void
  totalCount?: number | null
  singular?: string
  pluralLabel?: string
}

export default function ListPagination({
  page,
  totalPages,
  onPage,
  totalCount,
  singular,
  pluralLabel,
}: ListPaginationProps) {
  const countLabel =
    totalCount != null && singular && pluralLabel
      ? `${totalCount} ${totalCount === 1 ? singular : pluralLabel}`
      : null

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {countLabel ? `${countLabel} · ` : ""}
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={page >= totalPages}
          onClick={() => onPage(Math.min(totalPages, page + 1))}
        >
          Próxima
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
