export const DEFAULT_PAGE_SIZE = 10

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

export function isPageSizeOption(value: number): value is PageSizeOption {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(value)
}

export function readPageSize(value: string | null): PageSizeOption {
  if (!value) return DEFAULT_PAGE_SIZE
  const size = Number(value)
  return Number.isInteger(size) && isPageSizeOption(size) ? size : DEFAULT_PAGE_SIZE
}
