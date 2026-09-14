import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { ArrowLeftIcon, GlobeIcon, LeafIcon } from '@/components/Icons';
import { LockedNutrition, NutritionTable } from '@/components/NutritionPanel';
import { PageShell } from '@/components/PageShell';
import { ErrorState } from '@/components/States';
import { getNutrition, getProduct } from '@/lib/api';
import {
  LANGUAGE_NAMES,
  getTranslator,
  isLanguage,
  toLanguage,
  translateErrorCode,
  type Language,
  type Translate,
} from '@/lib/i18n';
import type { ProductDetail } from '@/lib/types';
import { BARCODE, BUTTON_SECONDARY, CARD, CONTAINER, EYEBROW, SECTION_TITLE } from '@/lib/ui';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ language?: string }>;
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const language = toLanguage((await searchParams).language);
  const translate = getTranslator(language);

  const result = await getProduct(code, language);

  return (
    <PageShell language={language} translate={translate}>
      <div className={`${CONTAINER} py-8 sm:py-10`}>
        <Link
          href={`/?language=${language}`}
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {translate('product.back')}
        </Link>

        {!result.ok ? (
          <div className="mt-8">
            <ErrorState
              title={translate('error.title')}
              message={translateErrorCode(translate, result.code)}
              action={
                <Link href={`/?language=${language}`} className={BUTTON_SECONDARY}>
                  {translate('product.back')}
                </Link>
              }
            />
          </div>
        ) : (
          /* Two columns from lg upward: a fixed-width media rail and a fluid
             content column. Below lg the grid collapses to a single column. */
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
            <ProductMedia product={result.data.product} translate={translate} />

            <div className="min-w-0 space-y-8">
              <ProductSummaryHeader
                product={result.data.product}
                language={language}
                translate={translate}
              />

              <ProductFacts
                product={result.data.product}
                language={language}
                translate={translate}
              />

              <Suspense
                fallback={
                  <div className={`${CARD} px-6 py-6 sm:px-8`}>
                    <p className="text-sm text-slate-500">{translate('product.loading')}</p>
                  </div>
                }
              >
                <NutritionSection code={code} language={language} translate={translate} />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

/** Image rail. Sticks beside the content on a large screen while the facts scroll. */
function ProductMedia({
  product,
  translate,
}: {
  product: ProductDetail;
  translate: Translate;
}) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className={`${CARD} relative aspect-square w-full overflow-hidden`}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            // Empty alt: the product name is the page's h1 immediately alongside,
            // so a description here would only duplicate it.
            alt=""
            fill
            sizes="(min-width: 1024px) 20rem, (min-width: 640px) 60vw, 90vw"
            className="object-contain p-6"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-300">
            <LeafIcon className="h-10 w-10" />
            <span className="text-sm text-slate-400">{translate('product.noImage')}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
        <span className={EYEBROW}>{translate('product.barcode')}</span>
        <span className={BARCODE}>{product.code}</span>
      </div>
    </div>
  );
}

function ProductSummaryHeader({
  product,
  language,
  translate,
}: {
  product: ProductDetail;
  language: Language;
  translate: Translate;
}) {
  return (
    <header>
      {product.brand ? (
        <p className={`${EYEBROW} mb-2`}>{product.brand}</p>
      ) : null}

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {product.name}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {product.quantity ? (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {product.quantity}
          </span>
        ) : null}

        {/* Tells the reader when Open Food Facts had no text in their language,
            rather than silently showing another one. */}
        <TranslationNote
          fieldLanguage={product.nameLanguage}
          language={language}
          translate={translate}
        />
      </div>
    </header>
  );
}

function TranslationNote({
  fieldLanguage,
  language,
  translate,
}: {
  fieldLanguage: string | null;
  language: Language;
  translate: Translate;
}) {
  // Only worth mentioning when the provider answered in a different language.
  if (!fieldLanguage || !isLanguage(fieldLanguage) || fieldLanguage === language) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
      <GlobeIcon className="h-3.5 w-3.5" />
      {translate('product.fallbackLanguage', { language: LANGUAGE_NAMES[fieldLanguage] })}
    </span>
  );
}

/** The descriptive fields, grouped into one card with a consistent row rhythm. */
function ProductFacts({
  product,
  language,
  translate,
}: {
  product: ProductDetail;
  language: Language;
  translate: Translate;
}) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <h2 className={SECTION_TITLE}>{translate('product.details')}</h2>
      </div>

      <dl className="divide-y divide-slate-100">
        <Row label={translate('product.brand')}>
          <Value value={product.brand} translate={translate} />
        </Row>

        <Row label={translate('product.quantity')}>
          <Value value={product.quantity} translate={translate} />
        </Row>

        <Row label={translate('product.categories')}>
          {product.categories.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {product.categories.map((category) => (
                <li
                  key={category}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  {category}
                </li>
              ))}
            </ul>
          ) : (
            <Value value={null} translate={translate} />
          )}
        </Row>

        <Row label={translate('product.ingredients')}>
          {product.ingredientsText ? (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-slate-700">{product.ingredientsText}</p>
              {/* Ingredients often fall back to a different language than the name,
                  so the note is repeated here rather than only in the header. */}
              <TranslationNote
                fieldLanguage={product.ingredientsLanguage}
                language={language}
                translate={translate}
              />
            </div>
          ) : (
            <Value value={null} translate={translate} />
          )}
        </Row>

        <Row label={translate('product.barcode')}>
          <span className={BARCODE}>{product.code}</span>
        </Row>
      </dl>
    </section>
  );
}

/**
 * One label/value row. Stacked on a phone and two-column from sm upward, which
 * keeps long ingredient lists readable instead of squeezing them into a column.
 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-6 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4 sm:px-8">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

/** Renders a translated placeholder instead of hiding fields the provider lacks. */
function Value({ value, translate }: { value: string | null; translate: Translate }) {
  if (!value) return <span className="text-slate-400">{translate('product.unknown')}</span>;
  return <span>{value}</span>;
}

/**
 * Nutrition is requested from the API like any other data. A 402 means the demo
 * user has no active subscription, and the response carries no values at all,
 * so the locked panel has nothing to reveal.
 */
async function NutritionSection({
  code,
  language,
  translate,
}: {
  code: string;
  language: Language;
  translate: Translate;
}) {
  const result = await getNutrition(code, language);

  if (result.ok) {
    return (
      <NutritionTable
        nutrition={result.data.nutrition}
        language={language}
        translate={translate}
      />
    );
  }

  if (result.code === 'SUBSCRIPTION_REQUIRED') {
    return <LockedNutrition language={language} translate={translate} />;
  }

  return (
    <ErrorState
      title={translate('error.title')}
      message={translateErrorCode(translate, result.code)}
    />
  );
}
