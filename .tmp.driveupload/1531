import { Skeleton, SkeletonCard, SkeletonRows } from "@/components/ui/feedback";

/** Module-shaped loading state so the layout does not jump when data arrives. */
export default function AppLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-9 w-80" />
        <Skeleton className="mt-3 h-3.5 w-64" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <SkeletonRows rows={5} />
    </div>
  );
}
