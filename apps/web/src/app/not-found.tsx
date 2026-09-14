import Link from 'next/link';

import { SearchIcon } from '@/components/Icons';
import { DEFAULT_LANGUAGE, getTranslator } from '@/lib/i18n';
import { BUTTON_PRIMARY, CARD, CONTAINER_NARROW } from '@/lib/ui';

/**
 * Replaces Next.js's default 404, which is unstyled and looks like a broken
 * deployment. An unmatched route carries no language parameter, so this page uses
 * the default language; a product that genuinely does not exist is handled by the
 * product page itself, in the reader's language.
 */
export default function NotFound() {
  const translate = getTranslator(DEFAULT_LANGUAGE);

  return (
    <main className="flex min-h-screen items-center bg-slate-50">
      <div className={`${CONTAINER_NARROW} py-16`}>
        <div className={`${CARD} px-6 py-12 text-center sm:px-10`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <SearchIcon className="h-7 w-7" />
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-400">404</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {translate('notFound.title')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            {translate('notFound.body')}
          </p>

          <Link href="/" className={`${BUTTON_PRIMARY} mt-8`}>
            {translate('product.back')}
          </Link>
        </div>
      </div>
    </main>
  );
}
