import { Suspense } from 'react';

import { PageHeader } from '@/components/PageHeader';
import { ProductCard } from '@/components/ProductCard';
import { SearchForm } from '@/components/SearchForm';
import { EmptyState, ErrorState, ResultsSkeleton } from '@/components/States';
import { getRecentSearches, searchProducts } from '@/lib/api';
import { getTranslator, toLanguage, translateErrorCode, type Language, type Translate } from '@/lib/i18n';
import type { RecentSearch } from '@/lib/types';

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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader language={language} translate={translate} />

      <p className="mb-4 text-sm text-slate-600">{translate('app.tagline')}</p>
      <SearchForm query={query} language={language} translate={translate} />

      <div className="mt-8">
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
      </div>

      <Suspense fallback={null}>
        <RecentSearches language={language} translate={translate} />
      </Suspense>
    </main>
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
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{translate('search.results', { query })}</h2>
        <p className="text-sm text-slate-500">
          {translate('search.count', { count: products.length })}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
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
    <section className="mt-10 border-t border-slate-200 pt-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{translate('search.recent')}</h2>

      {searches.length === 0 ? (
        <p className="text-sm text-slate-500">{translate('search.recent.empty')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {searches.map((search) => (
            <li key={`${search.term}-${search.language}`}>
              <a
                href={`/?q=${encodeURIComponent(search.term)}&language=${search.language}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:border-slate-500 hover:bg-slate-50"
              >
                <span>{search.term}</span>
                <span className="text-xs uppercase text-slate-400">{search.language}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
