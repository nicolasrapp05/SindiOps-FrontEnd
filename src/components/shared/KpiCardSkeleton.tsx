import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type KpiCardVariant = "compact" | "alerta" | "stat"

export function KpiCardSkeleton({ variant = "compact" }: { variant?: KpiCardVariant }) {
  if (variant === "alerta") {
    return (
      <div
        aria-hidden="true"
        className="flex flex-col justify-between rounded-2xl border-t-4 border-t-transparent bg-card p-3.5 ring-1 ring-border sm:min-h-40 sm:p-5"
      >
        <Skeleton className="size-10 rounded-xl" />
        <div className="mt-3 sm:mt-4">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="mt-1 h-9 w-12" />
        </div>
        <Skeleton className="mt-3 h-4 w-16" />
      </div>
    )
  }

  if (variant === "stat") {
    return (
      <Card aria-hidden="true">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-16" />
        </CardContent>
      </Card>
    )
  }

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
