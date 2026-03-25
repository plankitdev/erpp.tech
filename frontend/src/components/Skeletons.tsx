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

export function SkeletonDashboard() {
  return (
    <div className="page-container space-y-6 animate-pulse">
      {/* Banner */}
      <div className="h-28 bg-gradient-to-l from-primary-100 to-primary-50 rounded-2xl" />
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="skeleton-shimmer w-11 h-11 rounded-xl" />
            </div>
            <div className="skeleton-shimmer h-3 w-20 mb-2" />
            <div className="skeleton-shimmer h-7 w-28" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="skeleton-shimmer h-5 w-32 mb-4" />
          <div className="skeleton-shimmer h-64 w-full rounded-xl" />
        </div>
        <div className="card p-5">
          <div className="skeleton-shimmer h-5 w-28 mb-4" />
          <div className="skeleton-shimmer h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonKanban({ columns = 4 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4 animate-pulse`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: columns }).map((_, colIdx) => (
        <div key={colIdx} className="bg-gray-50 rounded-2xl border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="skeleton-shimmer w-3 h-3 rounded-full" />
            <div className="skeleton-shimmer h-4 w-20" />
            <div className="skeleton-shimmer h-5 w-7 rounded-full mr-auto" />
          </div>
          {Array.from({ length: 3 - (colIdx % 2) }).map((_, cardIdx) => (
            <div key={cardIdx} className="bg-white rounded-xl border border-gray-100 p-4 mb-2">
              <div className="skeleton-shimmer h-4 w-3/4 mb-3" />
              <div className="skeleton-shimmer h-3 w-1/2 mb-3" />
              <div className="flex items-center gap-2">
                <div className="skeleton-shimmer w-6 h-6 rounded-full" />
                <div className="skeleton-shimmer h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonTaskItem() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="skeleton-shimmer w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-shimmer h-4 w-1/3" />
          <div className="skeleton-shimmer h-3 w-1/2" />
        </div>
        <div className="skeleton-shimmer w-20 h-7 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonMeetingCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="skeleton-shimmer h-5 w-40" />
            <div className="skeleton-shimmer h-5 w-16 rounded-full" />
            <div className="skeleton-shimmer h-5 w-14 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <div className="skeleton-shimmer h-3 w-28" />
            <div className="skeleton-shimmer h-3 w-20" />
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer w-7 h-7 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="skeleton-shimmer w-8 h-8 rounded-lg" />
          <div className="skeleton-shimmer w-8 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonNotification() {
  return (
    <div className="px-6 py-4 flex items-start gap-4 animate-pulse">
      <div className="skeleton-shimmer w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer h-4 w-48" />
          <div className="skeleton-shimmer h-5 w-20 rounded" />
        </div>
        <div className="skeleton-shimmer h-3 w-3/4" />
        <div className="skeleton-shimmer h-3 w-24" />
      </div>
    </div>
  );
}
