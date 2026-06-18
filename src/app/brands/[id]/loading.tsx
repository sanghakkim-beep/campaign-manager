export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-4 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mt-2 h-7 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="mt-1.5 h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="h-9 w-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>

      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="mt-1 h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      </div>

      <div className="h-6 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="h-4 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-2 h-5 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-1 h-3 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-2 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
