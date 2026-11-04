export type SortDir = "asc" | "desc"

export interface SortQuery {
  sort?: string
  dir?: SortDir
}

export interface SortColumn {
  key: string
  label: string
}

export function nextSort(
  sort: string | undefined,
  dir: SortDir | undefined,
  column: string,
): SortQuery {
  if (sort !== column) return { sort: column, dir: "asc" }
  if (dir === "asc") return { sort: column, dir: "desc" }
  return {}
}

export function sortValue(sort?: string, dir?: SortDir): string {
  return sort && dir ? `${sort}:${dir}` : ""
}

export function sortFromValue(value: string, columns: SortColumn[]): SortQuery {
  if (!value) return {}
  const [key, dir] = value.split(":")
  if (!columns.some((column) => column.key === key)) return {}
  if (dir !== "asc" && dir !== "desc") return {}
  return { sort: key, dir }
}
