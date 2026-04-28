'use client';

/**
 * ResearchSkeleton
 * ─────────────────
 * Pulse skeleton shown while the initial workspace data
 * (sources, clusters, graphNodes) is being fetched.
 *
 * Uses only Tailwind utility classes so no module CSS import is needed.
 * Layout matches the real page: left column (sources + graph + tools) and
 * right-column sidebar.
 */
export default function ResearchSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_340px] gap-8 p-8 animate-pulse">

      {/* ── Left Column ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-8">

        {/* Sources panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-5 h-5 bg-slate-200 rounded-full" />
            <div className="h-4 w-40 bg-slate-200 rounded-full" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-50 last:border-0">
              <div className="w-10 h-12 bg-slate-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 bg-slate-200 rounded-full" />
                <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
              </div>
              <div className="w-10 h-5 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>

        {/* Knowledge graph */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="h-4 w-48 bg-slate-200 rounded-full mb-4" />
          <div className="relative h-48 bg-slate-50 rounded-xl">
            {[
              { top: '40%', left: '30%' },
              { top: '60%', left: '50%' },
              { top: '30%', left: '70%' },
              { top: '70%', left: '20%' },
              { top: '20%', left: '45%' },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-16 h-7 bg-slate-200 rounded-full"
                style={{ top: pos.top, left: pos.left, transform: 'translate(-50%,-50%)' }}
              />
            ))}
          </div>
        </div>

        {/* Tool grid */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="h-4 w-40 bg-slate-200 rounded-full mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Column (Sidebar) ──────────────────────────────────── */}
      <div className="flex flex-col gap-4">

        {/* Research Clusters card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="h-4 w-36 bg-slate-200 rounded-full mb-4" />
          {[92, 74, 48].map((w, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <div className="flex justify-between mb-1.5">
                <div className="h-3 w-32 bg-slate-100 rounded-full" />
                <div className="h-3 w-8 bg-slate-100 rounded-full" />
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-200 rounded-full" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Active Agents card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="h-4 w-44 bg-slate-200 rounded-full mb-4" />
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-2 last:mb-0">
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="h-3 w-28 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>

        {/* Timeline card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="h-4 w-36 bg-slate-200 rounded-full mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200 flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-full bg-slate-100 rounded-full" />
                <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
