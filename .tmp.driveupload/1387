import { Skeleton, SkeletonCard, SkeletonRows } from "@/components/ui/feedback";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonRows rows={6} />
    </div>
  );
}
