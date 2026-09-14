import Link from 'next/link';
import { Suspense } from 'react';

import { SearchIcon } from '@/components/Icons';
import { PageShell } from '@/components/PageShell';
import { ProductCard } from '@/components/ProductCard';
import { SearchForm } from '@/components/SearchForm';
import { EmptyState, ErrorState, ResultsSkeleton } from '@/components/States';
import { getRecentSearches, searchProducts } from '@/lib/api';
import { getTranslator, toLanguage, translateErrorCode, type Language, type Translate } from '@/lib/i18n';
import type { RecentSearch } from '@/lib/types';
import { CONTAINER, EYEBROW, SECTION_TITLE } from '@/lib/ui';

/** The search term and language live in the URL, so this page is always dynamic. */
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string; language?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const language = toLanguage(params.language);
  const translate = getTranslator(language);
  const query = params.q?.trim() ?? '';

  return (
    <PageShell language={language} translate={translate}>
      {/* Hero. The subtle gradient and ring give the search area a distinct
          surface without introducing a second background colour. */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-white via-white to-slate-50">
        <div className={`${CONTAINER} py-14 sm:py-20`}>
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {translate('home.hero.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {translate('home.hero.subtitle')}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-2xl sm:mt-10">
            <SearchForm query={query} language={language} translate={translate} />
            <p className="mt-3 text-center text-xs text-slate-500">
              {translate('search.start.body')}
            </p>
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} py-10 sm:py-12`}>
        {query ? (
          // Keyed on the query so a new search shows the skeleton again while the
          // server fetches, instead of leaving the previous results on screen.
          <Suspense
            key={`${query}-${language}`}
            fallback={<ResultsSkeleton label={translate('search.loading')} />}
          >
            <Results query={query} language={language} translate={translate} />
          </Suspense>
        ) : (
          <EmptyState
            title={translate('search.start.title')}
            body={translate('search.start.body')}
          />
        )}

        <Suspense fallback={null}>
          <RecentSearches language={language} translate={translate} />
        </Suspense>
      </div>
    </PageShell>
  );
}

async function Results({
  query,
  language,
  translate,
}: {
  query: string;
  language: Language;
  translate: Translate;
}) {
  const result = await searchProducts(query, language);

  if (!result.ok) {
    return (
      <ErrorState
        title={translate('error.title')}
        message={translateErrorCode(translate, result.code)}
      />
    );
  }

  const { products } = result.data;

  if (products.length === 0) {
    return (
      <EmptyState title={translate('search.empty.title')} body={translate('search.empty.body')} />
    );
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className={SECTION_TITLE}>{translate('search.results', { query })}</h2>
        <p className="text-sm text-slate-500">
          {translate('search.count', { count: products.length })}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.code}
            product={product}
            language={language}
            translate={translate}
          />
        ))}
      </ul>
    </section>
  );
}

async function RecentSearches({
  language,
  translate,
}: {
  language: Language;
  translate: Translate;
}) {
  const result = await getRecentSearches();
  // Recent searches are a convenience; if they cannot be loaded the page still works.
  const searches: RecentSearch[] = result.ok ? result.data.searches : [];

  return (
    <section className="mt-14 border-t border-slate-200 pt-8">
      <h2 className={`${EYEBROW} mb-4`}>{translate('search.recent')}</h2>

      {searches.length === 0 ? (
        <p className="text-sm text-slate-500">{translate('search.recent.empty')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {searches.map((search) => (
            <li key={`${search.term}-${search.language}`}>
              {/* next/link rather than a bare anchor, so re-running a recent search
                  is a client navigation instead of a full document load. */}
              <Link
                href={`/?q=${encodeURIComponent(search.term)}&language=${search.language}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-3.5 text-sm text-slate-700 shadow-sm transition duration-200 hover:border-brand-300 hover:text-brand-700"
              >
                <SearchIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>{search.term}</span>
                <span className="text-xs font-medium uppercase text-slate-400">
                  {search.language}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
