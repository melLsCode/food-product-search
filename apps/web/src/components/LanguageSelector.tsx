'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { LANGUAGES, LANGUAGE_NAMES, getTranslator, type Language } from '@/lib/i18n';

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
    <label className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">{translate('language.label')}</span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value)}
        disabled={isPending}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 disabled:opacity-60"
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
