import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

import { LockedNutrition, NutritionTable } from '@/components/NutritionPanel';
import { PageHeader } from '@/components/PageHeader';
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader language={language} translate={translate} />

      <Link
        href={`/?language=${language}`}
        className="text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900"
      >
        ← {translate('product.back')}
      </Link>

      {!result.ok ? (
        <div className="mt-6">
          <ErrorState
            title={translate('error.title')}
            message={translateErrorCode(translate, result.code)}
          />
        </div>
      ) : (
        <>
          <ProductDetails product={result.data.product} translate={translate} />

          <div className="mt-6">
            <Suspense
              fallback={
                <p className="text-sm text-slate-500">{translate('product.loading')}</p>
              }
            >
              <NutritionSection code={code} language={language} translate={translate} />
            </Suspense>
          </div>
        </>
      )}
    </main>
  );
}

function ProductDetails({
  product,
  translate,
}: {
  product: ProductDetail;
  translate: Translate;
}) {
  return (
    <article className="mt-4 flex flex-col gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0 self-center overflow-hidden rounded-lg bg-slate-100 sm:self-start">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="176px"
            className="object-contain"
            unoptimized
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            {translate('product.noImage')}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-slate-900">{product.name}</h1>
        <p className="mt-1 font-mono text-xs text-slate-400">{product.code}</p>

        {/* Tells the user when Open Food Facts had no text in their language. */}
        {product.nameLanguage && isLanguage(product.nameLanguage) ? (
          <p className="mt-2 inline-block rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {translate('product.fallbackLanguage', {
              language: LANGUAGE_NAMES[product.nameLanguage],
            })}
          </p>
        ) : null}

        <dl className="mt-4 space-y-2 text-sm">
          <Field label={translate('product.brand')} value={product.brand} translate={translate} />
          <Field
            label={translate('product.quantity')}
            value={product.quantity}
            translate={translate}
          />
          <Field
            label={translate('product.categories')}
            value={product.categories.length > 0 ? product.categories.join(', ') : null}
            translate={translate}
          />
          <Field
            label={translate('product.ingredients')}
            value={product.ingredientsText}
            translate={translate}
          />
        </dl>
      </div>
    </article>
  );
}

/** Renders a translated placeholder instead of hiding fields the provider lacks. */
function Field({
  label,
  value,
  translate,
}: {
  label: string;
  value: string | null;
  translate: Translate;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="shrink-0 font-medium text-slate-500 sm:w-28">{label}</dt>
      <dd className={value ? 'text-slate-900' : 'text-slate-400'}>
        {value ?? translate('product.unknown')}
      </dd>
    </div>
  );
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
    return <NutritionTable nutrition={result.data.nutrition} translate={translate} />;
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
