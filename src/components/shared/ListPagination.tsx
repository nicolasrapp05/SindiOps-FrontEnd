import { useId } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  isPageSizeOption,
  type PageSizeOption,
} from "@/lib/pagination"
import { scrollConteudoToTop } from "@/lib/scroll-conteudo"

interface ListPaginationProps {
  page: number
  totalPages: number
  onPage: (page: number) => void
  pageSize: number
  onPageSize: (pageSize: PageSizeOption) => void
  totalCount?: number | null
  singular?: string
  pluralLabel?: string
}

export default function ListPagination({
  page,
  totalPages,
  onPage,
  pageSize,
  onPageSize,
  totalCount,
  singular,
  pluralLabel,
}: ListPaginationProps) {
  const sizeId = useId()
  const size = isPageSizeOption(pageSize) ? pageSize : DEFAULT_PAGE_SIZE
  const countLabel =
    totalCount != null && singular && pluralLabel
      ? `${totalCount} ${totalCount === 1 ? singular : pluralLabel}`
      : null

  const goTo = (next: number) => {
    const target = Math.min(totalPages, Math.max(1, next))
    if (target === page) return
    onPage(target)
    scrollConteudoToTop()
  }

  const chooseSize = (value: string) => {
    const next = Number(value)
    if (!isPageSizeOption(next) || next === size) return
    onPageSize(next)
    scrollConteudoToTop()
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {countLabel ? `${countLabel} · ` : ""}
        Página {page} de {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor={sizeId} className="text-sm text-muted-foreground">
            Por página
          </label>
          <Select value={String(size)} onValueChange={chooseSize}>
            <SelectTrigger
              id={sizeId}
              aria-label="Itens por página"
              className="h-11 w-[4.75rem] min-h-11 bg-card"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={page <= 1}
            onClick={() => goTo(page - 1)}
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
            onClick={() => goTo(page + 1)}
          >
            Próxima
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
