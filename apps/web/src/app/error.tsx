'use client';

import { useSearchParams } from 'next/navigation';

import { AlertIcon } from '@/components/Icons';
import { getTranslator, toLanguage } from '@/lib/i18n';
import { BUTTON_PRIMARY, CARD, CONTAINER_NARROW } from '@/lib/ui';

/**
 * Last-resort boundary for unexpected render errors. Expected API failures are
 * handled inside the pages, where they can be shown with a specific message.
 *
 * This is a Client Component, so it deliberately does not use PageShell: the
 * shell is a Server Component tree. It renders a self-contained frame instead.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const translate = getTranslator(toLanguage(useSearchParams().get('language')));

  return (
    <main className="flex min-h-screen items-center bg-slate-50">
      <div className={`${CONTAINER_NARROW} py-16`}>
        <div role="alert" className={`${CARD} px-6 py-12 text-center sm:px-10`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertIcon className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-xl font-bold tracking-tight text-slate-900">
            {translate('error.title')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            {translate('error.INTERNAL_ERROR')}
          </p>

          <button type="button" onClick={reset} className={`${BUTTON_PRIMARY} mt-8`}>
            {translate('error.retry')}
          </button>
        </div>
      </div>
    </main>
  );
}
