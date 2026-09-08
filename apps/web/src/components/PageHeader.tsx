import Link from 'next/link';

import { LanguageSelector } from '@/components/LanguageSelector';
import type { Language, Translate } from '@/lib/i18n';

export function PageHeader({
  language,
  translate,
}: {
  language: Language;
  translate: Translate;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
      <Link href={`/?language=${language}`} className="text-lg font-semibold text-slate-900">
        {translate('app.title')}
      </Link>
      <LanguageSelector language={language} />
    </header>
  );
}
