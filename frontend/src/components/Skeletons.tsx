interface SkeletonProps {
  className?: string;
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return <div className={`skeleton-shimmer h-4 ${className}`} />;
}

export function SkeletonCircle({ className = 'w-10 h-10' }: SkeletonProps) {
  return <div className={`skeleton-shimmer rounded-full ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-shimmer h-4 w-3/4" />
          <div className="skeleton-shimmer h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton-shimmer h-3 w-full" />
        <div className="skeleton-shimmer h-3 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton-shimmer h-3 w-20" />
        <div className="skeleton-shimmer w-10 h-10 rounded-xl" />
      </div>
      <div className="skeleton-shimmer h-8 w-28 mb-2" />
      <div className="skeleton-shimmer h-3 w-16" />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="animate-pulse">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-5 py-4">
              <div
                className={`skeleton-shimmer h-4 rounded ${colIdx === 0 ? 'w-3/4' : 'w-full'}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonForm() {
  return (
    <div className="card p-6 space-y-5 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="skeleton-shimmer h-3 w-24" />
          <div className="skeleton-shimmer h-10 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <div className="skeleton-shimmer h-11 w-28 rounded-xl" />
        <div className="skeleton-shimmer h-11 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-7 w-40" />
          <div className="skeleton-shimmer h-4 w-24" />
        </div>
        <div className="skeleton-shimmer h-11 w-32 rounded-xl" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      {/* Table */}
      <SkeletonTable />
    </div>
  );
}
