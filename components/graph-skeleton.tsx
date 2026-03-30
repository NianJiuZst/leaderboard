import { Skeleton } from '@/components/ui/skeleton'

export function GraphSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-background p-4" data-testid="graph-skeleton">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-lg" />
      </div>
    </div>
  )
}
