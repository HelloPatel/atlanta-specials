/**
 * Reusable skeleton loading components for perceived performance.
 */

export function SkeletonLine({ width = '100%', height = '1rem', className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 space-y-3 ${className}`}>
      <SkeletonLine width="60%" height="1.25rem" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="80%" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-200" />
      <div className="space-y-1.5">
        <SkeletonLine width="2rem" height="1.5rem" />
        <SkeletonLine width="3rem" height="0.75rem" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  const headerWidths = ['24%', '32%', '20%', '28%'];
  const rowWidths = ['30%', '22%', '36%', '26%'];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-3 flex gap-4">
        {headerWidths.map((width) => (
          <SkeletonLine key={width} width={width} height="0.875rem" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-50 px-4 py-3 flex gap-4">
          {rowWidths.map((width, j) => (
            <SkeletonLine key={`${i}-${j}`} width={width} height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <SkeletonLine width="200px" height="1.75rem" />
        <SkeletonLine width="140px" height="0.875rem" className="mt-2" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
