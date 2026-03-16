import { cn } from '../../lib/utils';

// ─── Base shimmer block ────────────────────────────────────────────────────────
function Sk({ className }) {
  return <div className={cn('bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl', className)} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// POS / CATALOG — product card
// ══════════════════════════════════════════════════════════════════════════════
function ProductCardSkeleton() {
  return (
    <div className="rounded-[2.5rem] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* Image */}
      <Sk className="w-full aspect-square md:aspect-[4/3] rounded-none" />
      {/* Info */}
      <div className="p-4 md:p-5 space-y-2.5">
        <Sk className="h-2.5 w-16 rounded-full" />
        <Sk className="h-4 w-4/5 rounded-lg" />
        <Sk className="h-6 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CATALOG MANAGER — sidebar cards (more compact)
// ══════════════════════════════════════════════════════════════════════════════
function CatalogRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
      <Sk className="w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Sk className="h-4 w-2/3 rounded-lg" />
        <Sk className="h-3 w-1/2 rounded-lg" />
      </div>
      <Sk className="w-16 h-7 rounded-full shrink-0" />
    </div>
  );
}

export function CatalogListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2 p-4">
      {/* Category pills row */}
      <div className="flex gap-2 mb-4 overflow-hidden">
        {[64, 96, 80, 96, 72].map((w, i) => (
          <Sk key={i} className="h-9 rounded-2xl shrink-0 animate-pulse" style={{ inlineSize: w }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <CatalogRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLIENTES — client card row
// ══════════════════════════════════════════════════════════════════════════════
function ClientRowSkeleton() {
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 rounded-[1.75rem] p-5 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
      {/* Avatar */}
      <Sk className="w-14 h-14 rounded-2xl shrink-0" />
      {/* Name + contact */}
      <div className="flex-1 space-y-2">
        <Sk className="h-4 w-44 rounded-lg" />
        <Sk className="h-3 w-28 rounded-lg" />
      </div>
      {/* Balance badge */}
      <Sk className="h-14 w-24 rounded-2xl shrink-0" />
    </div>
  );
}

export function ClientListSkeleton({ count = 5 }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ClientRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — stat cards + chart + top products
// ══════════════════════════════════════════════════════════════════════════════
function StatCardSkeleton() {
  return (
    <div className="rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Sk className="h-3 w-24 rounded-full" />
        <Sk className="w-10 h-10 rounded-2xl" />
      </div>
      <Sk className="h-9 w-32 rounded-xl" />
      <Sk className="h-3 w-20 rounded-full" />
    </div>
  );
}

function ChartBarSkeleton({ heights }) {
  return (
    <div className="flex items-end justify-around gap-1 h-40 px-2">
      {heights.map((h, i) => (
        <Sk
          key={i}
          className="flex-1 rounded-t-lg animate-pulse"
          style={{ blockSize: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* 4 stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* Chart + Top products row */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Chart (ocupa 2/3) */}
        <div className="md:col-span-2 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 space-y-4">
          <div className="flex justify-between">
            <Sk className="h-5 w-40 rounded-lg" />
            <Sk className="h-7 w-24 rounded-xl" />
          </div>
          <ChartBarSkeleton heights={[40, 65, 50, 80, 55, 70, 45, 90, 60, 75, 50, 85]} />
        </div>
        {/* Top products (ocupa 1/3) */}
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 space-y-3">
          <Sk className="h-5 w-32 rounded-lg mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Sk className="w-8 h-8 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3.5 w-3/4 rounded-lg" />
                <Sk className="h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS — user row
// ══════════════════════════════════════════════════════════════════════════════
function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
      <Sk className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Sk className="h-4 w-36 rounded-lg" />
        <Sk className="h-3 w-48 rounded-lg" />
      </div>
      <Sk className="h-6 w-16 rounded-full shrink-0" />
      <Sk className="h-8 w-8 rounded-xl shrink-0" />
    </div>
  );
}

export function UserListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <UserRowSkeleton key={i} />
      ))}
    </div>
  );
}
