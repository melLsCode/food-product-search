import type { ReactNode } from 'react';

import { AlertIcon, SearchIcon } from '@/components/Icons';
import { CARD } from '@/lib/ui';

/**
 * Shared empty / informational panel. Given an icon and a generous amount of
 * vertical space so an empty result set reads as a deliberate state rather than
 * as a page that failed to load.
 */
export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`${CARD} flex flex-col items-center px-6 py-14 text-center`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <SearchIcon className="h-6 w-6" />}
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {body ? <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/**
 * Shared error panel, used for every failed API call. Deliberately restrained:
 * a full red block reads as a crash, so the colour is carried by the icon and a
 * thin accent while the surface stays consistent with every other card.
 */
export function ErrorState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className={`${CARD} flex flex-col items-center px-6 py-12 text-center`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertIcon className="h-6 w-6" />
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/**
 * Skeleton shown while a Server Component streams in. The shapes mirror
 * ProductCard's proportions so the layout does not shift when results arrive.
 */
export function ResultsSkeleton({ label }: { label: string }) {
  return (
    <div>
      {/* Announced politely: a sighted user sees the shapes, a screen reader
          user gets told that a search is running. */}
      <p aria-live="polite" className="mb-4 text-sm text-slate-500">
        {label}
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <li key={index} className={`${CARD} overflow-hidden`}>
            <div className="aspect-square w-full animate-pulse bg-slate-100" />
            <div className="space-y-2.5 border-t border-slate-100 p-4">
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-2/5 animate-pulse rounded bg-slate-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Skeleton for the product detail page, matching its two-column layout. */
export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className={`${CARD} aspect-square w-full animate-pulse bg-slate-100`} />
      <div className="space-y-4">
        <div className="h-7 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className={`${CARD} space-y-3 p-6`}>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-4 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
