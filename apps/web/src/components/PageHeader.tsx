import Link from 'next/link';

import { LeafIcon } from '@/components/Icons';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { Language, Translate } from '@/lib/i18n';
import { CONTAINER } from '@/lib/ui';

/**
 * Application header. Sticky so the language selector and the way back to search
 * stay reachable while scrolling a long ingredient list on a phone.
 */
export function PageHeader({
  language,
  translate,
}: {
  language: Language;
  translate: Translate;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-sm">
      <div className={`${CONTAINER} flex h-16 items-center justify-between gap-4`}>
        <Link
          href={`/?language=${language}`}
          className="group flex min-w-0 items-center gap-2.5 rounded-lg"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm transition group-hover:bg-brand-700">
            <LeafIcon className="h-5 w-5" />
          </span>
          {/* The wordmark is the layout's first casualty on a narrow phone, but the
              mark stays, so the link remains recognisable and tappable. */}
          <span className="truncate text-base font-semibold tracking-tight text-slate-900">
            {translate('app.title')}
          </span>
        </Link>

        <LanguageSelector language={language} />
      </div>
    </header>
  );
}
