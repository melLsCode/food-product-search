import type { ReactNode } from 'react';

/** Shared empty / informational panel. */
export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {body ? <p className="mt-1 text-sm text-slate-500">{body}</p> : null}
    </div>
  );
}

/** Shared error panel, used for every failed API call. */
export function ErrorState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
      <p className="font-medium text-red-900">{title}</p>
      <p className="mt-1 text-sm text-red-800">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/** Skeleton shown by loading.tsx while a Server Component streams in. */
export function ResultsSkeleton({ label }: { label: string }) {
  return (
    <div aria-live="polite">
      <p className="mb-3 text-sm text-slate-500">{label}</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <li key={index} className="flex gap-4 rounded-lg border border-slate-200 p-3">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded bg-slate-200" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
