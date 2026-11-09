import { Skeleton } from "@/components/ui/skeleton"

export function KpiCardSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-2xl bg-card p-3 ring-1 ring-border sm:p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-10" />
        </div>
      </div>
    </div>
  )
}
