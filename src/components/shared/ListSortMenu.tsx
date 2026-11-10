import Combobox from "@/components/shared/Combobox"
import { sortFromValue, sortValue, type SortColumn, type SortDir } from "@/lib/list-sort"

interface ListSortMenuProps {
  columns: SortColumn[]
  sort?: string
  dir?: SortDir
  onChange: (sort?: string, dir?: SortDir) => void
  className?: string
}

export default function ListSortMenu({
  columns,
  sort,
  dir,
  onChange,
  className,
}: ListSortMenuProps) {
  const options = [
    { value: "", label: "Ordem padrão" },
    ...columns.flatMap((column) => [
      { value: `${column.key}:asc`, label: `${column.label}, crescente` },
      { value: `${column.key}:desc`, label: `${column.label}, decrescente` },
    ]),
  ]

  return (
    <div className={className ?? "w-full sm:w-56 lg:hidden"}>
      <Combobox
        options={options}
        value={sortValue(sort, dir)}
        onValueChange={(value) => {
          const next = sortFromValue(value, columns)
          onChange(next.sort, next.dir)
        }}
        placeholder="Ordenar"
        searchPlaceholder="Buscar…"
        className="w-full"
      />
    </div>
  )
}
