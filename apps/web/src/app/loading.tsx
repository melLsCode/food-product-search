import { ResultsSkeleton } from '@/components/States';

/** Shown while a navigation renders on the server. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 h-8 w-full animate-pulse rounded bg-slate-200" />
      <ResultsSkeleton label="…" />
    </main>
  );
}
