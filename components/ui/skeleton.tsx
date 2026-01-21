import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      data-slot="skeleton"
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-full max-w-[80%]" />
      <Skeleton className="h-3 w-full max-w-[60%]" />
    </div>
  );
}

function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }, (_, i) => (
        <div
          className="flex items-center gap-3"
          key={`skeleton-list-${Date.now()}-${i}`}
        >
          <Skeleton className="h-3 w-3 rounded" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          className={cn("h-3", i === lines - 1 ? "w-3/4" : "w-full")}
          key={`skeleton-text-${Date.now()}-${i}`}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonList, SkeletonText };
