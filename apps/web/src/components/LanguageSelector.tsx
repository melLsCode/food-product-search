'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { GlobeIcon, SpinnerIcon } from '@/components/Icons';
import { LANGUAGES, LANGUAGE_NAMES, getTranslator, type Language } from '@/lib/i18n';
import { SELECT } from '@/lib/ui';

/**
 * Manual language selector. The language lives in the URL, so switching it is a
 * navigation: the page re-renders on the server in the new language and the
 * current search term is preserved.
 *
 * Client components build their own translator from the language string. A
 * translator function cannot be passed from a Server Component, because props
 * crossing that boundary have to be serializable.
 */
export function LanguageSelector({ language }: { language: Language }) {
  const translate = getTranslator(language);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('language', next);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <label className="flex shrink-0 items-center gap-2">
      {/* The icon carries the meaning on a narrow screen; the text label stays in
          the accessibility tree at every width rather than being dropped. */}
      <span className="text-slate-400" aria-hidden="true">
        {isPending ? <SpinnerIcon className="h-4 w-4" /> : <GlobeIcon className="h-4 w-4" />}
      </span>
      <span className="sr-only sm:not-sr-only sm:text-sm sm:text-slate-600">
        {translate('language.label')}
      </span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value)}
        disabled={isPending}
        className={SELECT}
      >
        {LANGUAGES.map((option) => (
          <option key={option} value={option}>
            {LANGUAGE_NAMES[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
