'use client';

import { useSearchParams } from 'next/navigation';

import { getTranslator, toLanguage } from '@/lib/i18n';

/**
 * Last-resort boundary for unexpected render errors. Expected API failures are
 * handled inside the pages, where they can be shown with a specific message.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const translate = getTranslator(toLanguage(useSearchParams().get('language')));

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="font-medium text-red-900">{translate('error.title')}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          {translate('error.retry')}
        </button>
      </div>
    </main>
  );
}
